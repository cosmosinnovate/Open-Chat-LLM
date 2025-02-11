from elasticsearch import Elasticsearch
from app.config import Config

class ElasticsearchClientFactory:
    @staticmethod
    def create_client() -> Elasticsearch:
        if not Config.ELASTICSEARCH_URL:
            raise ValueError("ELASTICSEARCH_URL environment variable is not set")
        
        return Elasticsearch(
            hosts=[Config.ELASTICSEARCH_URL],
            basic_auth=(Config.ELASTICSEARCH_USERNAME, Config.ELASTICSEARCH_PASSWORD)
        )

        # return Elasticsearch(Config.ELASTICSEARCH_URL, api_key=Config.ELASTICSEARCH_API_KEY)