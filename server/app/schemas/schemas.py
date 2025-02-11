from marshmallow import Schema, fields


class UserSchema(Schema):
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    is_active = fields.Bool(required=True)
    created_at = fields.DateTime(required=True)


class ChatHistorySchema(Schema):
    user_id = fields.UUID(required=True)
    title = fields.Str(required=True)
    messages = fields.Str(required=True)


class MessageContentSchema(Schema):
    role = fields.String(required=True)
    content = fields.String(required=True)
    context = fields.String(required=False)


class UpdateChatMessageSchema(Schema):
    messages = fields.List(fields.Nested(MessageContentSchema), required=True)
