from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from openai import OpenAI

from .utils import build_system_prompt


class ChatView(APIView):
    """POST /api/ai/chat/ — Send a message to the AI assistant with conversation history.
    Accepts {
      message: string,
      history?: [{role: "user"|"assistant", content: string}, ...],
      context?: { page?: string }
    }
    Returns { reply: string }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.DEEPSEEK_API_KEY:
            return Response(
                {'error': 'AI assistant is not configured. Set DEEPSEEK_API_KEY.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        profile = getattr(request.user, 'profile', None)
        role = profile.role if profile else 'user'

        context = request.data.get('context', {})
        page = context.get('page', '')

        system_prompt = build_system_prompt(role, page, profile)

        # Build message list: system prompt + history + current message
        messages = [{"role": "system", "content": system_prompt}]

        # Include conversation history (last 20 messages to keep context manageable)
        history = request.data.get('history', []) or []
        for h in history[-20:]:
            if h.get('role') in ('user', 'assistant') and h.get('content', '').strip():
                messages.append({"role": h['role'], "content": h['content']})

        messages.append({"role": "user", "content": message})

        try:
            client = OpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url="https://api.deepseek.com",
            )
            response = client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=400,
            )
            reply = response.choices[0].message.content
            return Response({'reply': reply})
        except Exception as e:
            return Response(
                {'error': f'AI service error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
