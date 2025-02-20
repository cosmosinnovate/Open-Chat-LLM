from cv2 import log
from flask import Blueprint, jsonify, request, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
import fitz  # PyMuPDF
import os

from app.schemas.schemas import ChatHistorySchema, UpdateChatMessageSchema
from app.services.chat_history_service import ChatHistoryService as chat_service
from app.llms.llm import LLMService as llm_service
from app.factory.elasticsearch_factory import ElasticsearchClientFactory
from app.services.elasticsearch_service import ElasticsearchService as es_service
from app.services.data_service import DataService as ds


logger = logging.getLogger(__name__)
chat_history_bp = Blueprint("chat", __name__)
chat_schema = ChatHistorySchema()
update_chat_message_schema = UpdateChatMessageSchema()

es = ElasticsearchClientFactory.create_client()


@chat_history_bp.route("", methods=["GET"])
@jwt_required()
def get_user_chats():
    try:
        current_user = get_jwt_identity()
        messages = chat_service.get_user_chats_by_id(current_user)

        return jsonify(messages)
    except Exception as e:
        logger.error(f"Error fetching chats: {str(e)}")
        return jsonify({"error": f"Something went wrong {e}"})


@chat_history_bp.route("/<string:chat_id>", methods=["GET"])
@jwt_required()
def get_chat(chat_id: str):
    try:
        current_user_id = get_jwt_identity()
        chat = chat_service.get_chat_history_by_id(chat_id, current_user_id)
        if not chat:
            return jsonify({"error": "Chat not found or not authorized"}), 404
        return jsonify(chat["messages"]), 200

    except Exception as e:
        logger.error(f"Error in get_chat: {str(e)}")
        return jsonify({"error": "An error occurred while fetching the chat"}), 500


@chat_history_bp.route("/<string:chat_id>", methods=["DELETE"])
@jwt_required()
def delete_chat_history_by_id(chat_id: str):
    try:
        current_user = get_jwt_identity()
        chat_service.delete_chat_history_by_id(chat_id, current_user)

        return jsonify({"message": "Chat deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error in delete_chat_history_by_id: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the chat"}), 500


@chat_history_bp.route("/<string:chat_id>", methods=["PATCH"])
@jwt_required()
def update_chat(chat_id: str):
    try:
        data = update_chat_message_schema.load(request.get_json())
        current_user = get_jwt_identity()
        updated_chat = chat_service.update_chat_history_by_id(
            current_user, chat_id, messages=data["messages"]
        )
        if updated_chat:
            return jsonify(updated_chat), 200
        else:
            return jsonify({"error": "Chat not found or update failed"}), 400
    except Exception as e:
        logger.error(f"Error in update_chat route: {str(e)}")
        return jsonify({"error": "An error occurred while updating the chat"}), 500


@chat_history_bp.route("/<string:chat_id>/title", methods=["PATCH"])
@jwt_required()
def update_chat_title(chat_id: str):
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        title = data.get("title", "")
        updated_title = chat_service.update_chat_title(
            chat_id=chat_id, user_id=current_user_id, title=title
        )
        
        logger.info(f"Update chat {updated_title}")
        if updated_title:
            return jsonify(updated_title), 200
        return jsonify({"error": "An error has occurred while updating the chat"}), 400
    except Exception as e:
        logger.error(f"Error in update_chat route: {str(e)}")
        return jsonify({"error": "An error occurred while updating the chat"}), 500

@chat_history_bp.route("", methods=["POST"])
@jwt_required()
def chat():
    """
      Handle the elastic connections an other vector databases separately to make sure that we can isolate them when we don't need them
      Steps:
      1. Get the user's query from the request
      2. Generate an embedding for the query
      3. Search for relevant documents based on the embedding
      4. Prepare the context for the LLM by concatenating the relevant documents
      5. Prepare the LLM input by including the context and user's query
      6. Generate a response using the LLM
    """
    try:
        data = request.get_json()
        messages = data.get("messages", [])
        model_name = data.get("model_name", "llama3.2")
        current_user = get_jwt_identity()

        if not messages or not isinstance(messages, list):
            return jsonify({"error": "Invalid messages format"}), 400

        user_message = messages.pop() if messages else None
        if not user_message or user_message.get("role") != "user":
            return jsonify({"error": "Last message must be a user message"}), 400

        user_question = user_message["content"].strip()

        # Generate embedding for semantic search
        query_embedding = llm_service.get_embedding(user_question)
        if not query_embedding:
            return jsonify({"error": "Query processing failed"}), 500

        index_name = os.getenv("ELASTICSEARCH_INDEX", "org_pedia")
        if not es.indices.exists(index=index_name):
            logger.error(f"Index {index_name} does not exist")
            return jsonify({"error": "No documents have been indexed yet"}), 404

        try:
            stats = es.count(index=index_name)["count"]
            doc_count = stats["indices"][index_name]["total"]["docs"]["count"]
            if doc_count == 0:
                return jsonify({"error": "No documents have been indexed yet"}), 404
        except Exception as e:
            logger.error(f"Failed to get index stats: {str(e)}")

        context_docs = []
        min_scores = [0.7, 0.5, 0.3]

        for min_score in min_scores:
            context_docs = es_service.search_documents(
                es, query_embedding, size=5, min_score=min_score
            )
            if context_docs:
                logger.info(
                    f"Found {len(context_docs)} documents with min_score {min_score}"
                )
                break
            else:
                logger.info(
                    f"No documents found with min_score {min_score}, trying lower threshold"
                )

        if context_docs:
            formatted_contexts = []
            for i, doc in enumerate(context_docs, 1):
                # Add clear section breaks and headers
                formatted_contexts.append(
                    f"=== DOCUMENT {i} START ===\n"
                    f"{doc}\n"
                    f"=== DOCUMENT {i} END ===\n"
                )
            context_text = "\n".join(formatted_contexts)

            logger.info(f"Found {len(context_docs)} relevant context documents")

            system_message = {
                "role": "system",
                "content": (
                    "You are an AI assistant providing information about documents as a source of truth. "
                    "You have access to documents. "
                    "When you cannot access a document, you provide a response to your best of ability. "
                    "Do not confuse this with any other companies. "
                    "Only use information from the provided documents. "
                    "Do not add any external knowledge or make assumptions."
                ),
            }

            context_text = f"{system_message['content']}\n\n{context_text}"
            context_message = {
                "role": "user",
                "content": (
                    f"Here are the official documents about documents as a source of truth:\n\n"
                    f"{context_text}\n\n"
                    f"Based only on these documents, please answer: {user_question}"
                ),
            }

            messages_for_llm = [system_message, context_message]
            logger.info("Prepared messages for LLM:")
            logger.info(f"1. System message: {system_message['content'][:100]}...")
            logger.info(f"2. Context length: {len(context_text)} characters")
            logger.info(f"3. User question: {user_question}")
        else:
            logger.info("No relevant context found")
            messages_for_llm = [
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant providing information about documents as a source of truth. "
                        "You have access to documents. "
                        "When you cannot access a document, you provide a response to your best of ability. "
                        "Do not confuse this with any other companies. "
                        "Only use information from the provided documents. "
                        "Do not add any external knowledge or make assumptions."
                    ),
                },
                {"role": "user", "content": user_question},
            ]

            logger.info("Prepared messages for LLM:")
            logger.info(f"1. System message: {messages_for_llm[0]['content'][:100]}...")
            logger.info(f"2. User question: {user_question}")

        messages_processing = messages_for_llm

        app = current_app._get_current_object()

        def generate():
            try:
                response = llm_service.generate_chat(
                    model_provider="ollama",
                    model_name=model_name,
                    messages=messages_processing,
                )

                full_response = ""
                for chunk in response:
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        full_response += content
                        yield f"data: {json.dumps({'content': content})}\n\n"

                    if chunk.get("done"):
                        with app.app_context():
                            messages.append(
                                {
                                    "role": "assistant",
                                    "content": full_response,
                                    "context": context_docs,
                                }
                            )
                            chat_service.create_chat_message(
                                user_id=current_user,
                                title=user_question[:20],
                                messages=messages,
                            )
                        break

                yield "data: [DONE]\n\n"

            except Exception as e:
                logger.error(f"Generation error: {str(e)}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return Response(
            generate(),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({"error": "Chat processing failed"}), 500


@chat_history_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400
        
        if file.mimetype.startswith("text/"):
            try:
                content = file.read().decode("utf-8")
            except UnicodeDecodeError:
                try:
                    content = file.read().decode("latin-1")
                except Exception as e:
                    return jsonify({"error": f"Text decoding failed: {str(e)}"}), 400
        elif file.mimetype == "application/pdf":
            reader = fitz.open(file)        
            content = "\n".join([page.get_text() for page in reader.pages])
        else:
            return jsonify({"error": f"Unsupported file type: {file.mimetype}"}), 400

        content = ds.clean_content(content)
        if not content:
            return jsonify({"error": "Content is empty after cleaning"}), 400

        embedding = llm_service.get_embedding(content)
        if not embedding:
            return jsonify({"error": "Embedding generation failed"}), 500
        
        index_name = os.getenv("ELASTICSEARCH_INDEX", "documents")
        if es.indices.exists(index=index_name):
            stats = es.count(index=index_name)["count"]
            mapping = es.indices.get_mapping(index=index_name)
            logger.info(f"Current mapping: {mapping}")
        else:
            logger.info("Index does not exist, will be created during indexing")

        # Index the document
        try:
            es_service.index_document(es, content, embedding)
            logger.info("Document indexed successfully")

            # Verify document was indexed
            stats = es.count(index=index_name)["count"]
            new_doc_count = stats
            logger.info(f"New document count: {new_doc_count}")

            # Try an immediate search to verify
            test_embedding = llm_service.get_embedding(
                content[:100]
            )  # Use first 100 chars as test
            if test_embedding:
                test_results = es_service.search_documents(
                    es, test_embedding, size=1, min_score=0.3
                )
                if test_results:
                    logger.info("Document verified in search results")
                else:
                    logger.warning("Document not found in immediate search test")

            return (
                jsonify(
                    {
                        "message": "File indexed successfully",
                        "documentCount": new_doc_count,
                    }
                ),
                200,
            )
        except Exception as e:
            logger.error(f"Indexing error: {str(e)}")
            # Try to recreate index
            try:
                if es.indices.exists(index=index_name):
                    es.indices.delete(index=index_name)
                es_service.create_index(es, index_name)
                es_service.index_document(es, content, embedding)
                logger.info("Successfully recreated index and indexed document")
                return (
                    jsonify(
                        {
                            "message": "File indexed successfully (after index recreation)"
                        }
                    ),
                    200,
                )
            except Exception as e2:
                logger.error(f"Index recreation failed: {str(e2)}")
                return (
                    jsonify(
                        {"error": f"Indexing failed even after recreation: {str(e2)}"}
                    ),
                    500,
                )

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({"error": f"File processing failed: {str(e)}"}), 500
