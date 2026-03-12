export interface ChatIntent {
  type: string;
  label: string;
  confidence: number;
  suggestedReplies: string[];
  icon: string;
}

interface IntentDefinition {
  type: string;
  label: string;
  keywords: string[];
  suggestedReplies: string[];
  icon: string;
}

const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    type: 'reschedule',
    label: 'Wants to Reschedule',
    keywords: [
      'reschedule',
      'change schedule',
      'move my meeting',
      'update my booking',
      'different date',
      'different time',
      'postpone',
      'cancel meeting',
      'cancel booking',
    ],
    suggestedReplies: [
      "I'd be happy to help you reschedule. What date and time works best for you?",
      "Let me check our available slots. I'll update your booking shortly.",
    ],
    icon: 'Calendar',
  },
  {
    type: 'product_inquiry',
    label: 'Product Inquiry',
    keywords: [
      'product',
      'price',
      'how much',
      'calibrator',
      'beamex',
      'equipment',
      'catalog',
      'specification',
      'specs',
    ],
    suggestedReplies: [
      "I'd be happy to help with product information. Which product are you interested in?",
      'You can browse our full catalog at the Products page. Would you like me to recommend something specific?',
    ],
    icon: 'ShoppingCart',
  },
  {
    type: 'quote_status',
    label: 'Asking About Quote',
    keywords: ['quote', 'quotation', 'estimate', 'pricing', 'proposal', 'my quote'],
    suggestedReplies: [
      'Let me check your quotation status for you.',
      "Your quotation is being reviewed. I'll update you as soon as there's a change.",
    ],
    icon: 'FileText',
  },
  {
    type: 'booking_status',
    label: 'Booking Status Check',
    keywords: [
      'booking',
      'appointment',
      'meeting status',
      'when is my meeting',
      'schedule',
      'my booking',
    ],
    suggestedReplies: [
      'Let me pull up your booking details.',
      'I can see your upcoming meeting. Let me get the details for you.',
    ],
    icon: 'Calendar',
  },
  {
    type: 'technical_support',
    label: 'Needs Technical Support',
    keywords: [
      'help',
      'issue',
      'problem',
      'not working',
      'error',
      'broken',
      'trouble',
      'support',
      'assist',
    ],
    suggestedReplies: [
      "I'd be happy to help. Can you describe the issue in more detail?",
      'Let me connect you with our technical team. In the meantime, could you share more details about the problem?',
    ],
    icon: 'HelpCircle',
  },
  {
    type: 'general_greeting',
    label: 'Greeting',
    keywords: ['hello', 'hi', 'good morning', 'good afternoon', 'hey'],
    suggestedReplies: [
      'Hello! How can I help you today?',
      'Hi there! Welcome to Accuro support. What can I assist you with?',
    ],
    icon: 'Smile',
  },
  {
    type: 'complaint',
    label: 'Customer Complaint',
    keywords: [
      'complaint',
      'unhappy',
      'dissatisfied',
      'frustrated',
      'disappointed',
      'bad experience',
      'poor service',
    ],
    suggestedReplies: [
      "I'm sorry to hear about your experience. Let me look into this right away.",
      'I apologize for the inconvenience. Can you tell me more about what happened so I can help resolve this?',
    ],
    icon: 'Frown',
  },
];

export function detectIntents(
  messages: { message: string; senderRole: string }[]
): ChatIntent[] {
  // Get last 3 user messages only
  const userMessages = messages
    .filter((m) => m.senderRole === 'user')
    .slice(-3);

  if (userMessages.length === 0) return [];

  const combinedText = userMessages.map((m) => m.message.toLowerCase()).join(' ');

  const intents: ChatIntent[] = [];

  for (const def of INTENT_DEFINITIONS) {
    let matchCount = 0;

    for (const keyword of def.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    if (matchCount === 0) continue;

    // Confidence: ratio of matched keywords to total, capped at 1
    const confidence = Math.min(matchCount / Math.max(def.keywords.length * 0.4, 1), 1);

    if (confidence > 0.3) {
      intents.push({
        type: def.type,
        label: def.label,
        confidence,
        suggestedReplies: def.suggestedReplies,
        icon: def.icon,
      });
    }
  }

  // Sort by confidence descending
  intents.sort((a, b) => b.confidence - a.confidence);

  return intents;
}
