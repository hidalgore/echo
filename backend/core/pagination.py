"""
Cursor pagination emitting the locked wire shape:

    { "items": [...], "nextCursor"?: str }

matching Paged<T> in frontend/types/api/shared.ts (`nextCursor` omitted on the
last page). Query params: `cursor`, `limit` (server-capped — bot-defense caps
live here, the client only honors them).
"""

from urllib.parse import parse_qsl, urlparse

from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


class EchoCursorPagination(CursorPagination):
    page_size = 20
    max_page_size = 100
    page_size_query_param = "limit"
    cursor_query_param = "cursor"
    # Product querysets order by their own fields; UUIDv7 pks are time-ordered
    # so -pk is a stable default until a model specifies otherwise.
    ordering = "-pk"

    def get_paginated_response(self, data):
        body = {"items": data}
        token = self._next_cursor_token()
        if token:
            body["nextCursor"] = token
        return Response(body)

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "required": ["items"],
            "properties": {
                "items": schema,
                "nextCursor": {"type": "string"},
            },
        }

    def _next_cursor_token(self):
        """Serve the bare cursor token, not a full URL — the client builds
        URLs itself from the endpoint registry."""
        link = self.get_next_link()
        if not link:
            return None
        query = dict(parse_qsl(urlparse(link).query))
        return query.get(self.cursor_query_param)
