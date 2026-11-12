"""AI auto-responder for chat. Answers when no admin is available."""
import logging
import os
import re
from openai import OpenAI

logger = logging.getLogger('chat')


def _sanitize(text):
    """Strip any prompt-injection markers from user-provided text."""
    if not text:
        return ''
    return re.sub(
        r'<[^>]*>|```|system:|assistant:|\[INST\]|\[/INST\]',
        '', str(text),
        flags=re.IGNORECASE,
    )[:300]


def get_ai_reply(user_name, user_message, franchise_name=None):
    """Generate an AI reply. Returns a helpful response letting the user know
    their message was received and someone will connect soon.

    Returns a string reply, or None if the AI key is not configured."""
    api_key = os.environ.get('DEEPSEEK_API_KEY')
    if not api_key:
        return None

    safe_name = _sanitize(user_name)
    safe_msg = _sanitize(user_message)
    safe_franchise = _sanitize(franchise_name) if franchise_name else None

    context_parts = [f"The user {safe_name} sent a message to FranchiseOS support."]
    if safe_franchise:
        context_parts.append(f"They are asking about the franchise: {safe_franchise}.")

    try:
        client = OpenAI(api_key=api_key, base_url='https://api.deepseek.com')
        response = client.chat.completions.create(
            model='deepseek-chat',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'You are a helpful assistant for FranchiseOS, a franchise management platform. '
                        'The user has sent a chat message and no support agent is currently online. '
                        'Your job: acknowledge their message warmly, let them know it has been received and '
                        'a team member will connect with them soon. Keep it friendly, brief (2-3 sentences max), '
                        'and helpful. If they asked about a specific franchise, mention it by name. '
                        'Always end with: "Someone from our team will connect with you shortly."'
                    ),
                },
                {
                    'role': 'user',
                    'content': f'{safe_name} says: {safe_msg}\n\n{" ".join(context_parts)}',
                },
            ],
            max_tokens=120,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning('AI auto-reply failed: %s', exc)
        return (
            f"Thanks for reaching out, {safe_name}! We've received your message "
            f"and someone from our team will connect with you shortly."
        )
