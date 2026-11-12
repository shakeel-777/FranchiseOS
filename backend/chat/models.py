from django.db import models
from django.contrib.auth.models import User
from franchises.models import Franchise


class Conversation(models.Model):
    """A chat conversation between a user and support (admin)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    franchise = models.ForeignKey(Franchise, on_delete=models.SET_NULL, null=True, blank=True)
    subject = models.CharField(max_length=300, default='General Inquiry')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} — {self.subject}"

    @property
    def last_message(self):
        return self.messages.order_by('-sequence').first()


class Message(models.Model):
    """A single message in a conversation."""
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
    )

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    sequence = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='sent')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sequence']
        unique_together = [('conversation', 'sequence')]

    def __str__(self):
        sender_name = self.sender.username if self.sender else 'Bot'
        return f"{sender_name}: {self.content[:60]}"

    def save(self, *args, **kwargs):
        if not self.pk:  # new message
            last = Message.objects.filter(conversation=self.conversation).order_by('-sequence').first()
            self.sequence = (last.sequence + 1) if last else 1
        super().save(*args, **kwargs)
