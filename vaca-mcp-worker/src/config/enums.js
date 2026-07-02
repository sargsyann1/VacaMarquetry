/**
 * VaCa Marquetry — MCP Worker Enum Contract
 * Verified against live schema: appgaZWpeSTTkjoUa / tblCOVYuKMZq28Usi (2026-06-29)
 */

export const ALLOWED = {
  lead_type: new Set([
    'WhatsApp Lead',
    'Artwork Inquiry',
    'Portrait Inquiry',
    'Contact',
    'Cookie Accept'
  ]),
  lead_source: new Set([
    'WhatsApp',
    'Artwork Page',
    'Contact Form',
    'Portrait Inquiry',
    'Website Organic'
  ]),
  interaction_type: new Set([
    'WhatsApp Click',
    'Form Submit',
    'Artwork Zoom',
    'Contact Form',
    'Page View',
    'Cookie Accept'
  ]),
  lead_heat: new Set(['🔥 Hot', '🟡 Warm', '❄️ Cold']),
  status: new Set([
    'New', 'In Review', 'Preview Sent', 'Quote Sent',
    'Deposit Received', 'In Production', 'Shipped',
    'Complete', 'Not Interested', 'Unqualified'
  ]),
  device_type: new Set(['Mobile', 'Desktop', 'Tablet'])
};

export const DEFAULTS = {
  whatsapp: {
    lead_type:        'WhatsApp Lead',
    lead_source:      'WhatsApp',
    interaction_type: 'WhatsApp Click',
    status:           'New'
  },
  contact: {
    lead_type:        'Contact',
    lead_source:      'Contact Form',
    interaction_type: 'Contact Form',
    status:           'New'
  },
  artwork_inquiry: {
    lead_type:        'Artwork Inquiry',
    lead_source:      'Artwork Page',
    interaction_type: 'Form Submit',
    status:           'New'
  },
  portrait_inquiry: {
    lead_type:        'Portrait Inquiry',
    lead_source:      'Portrait Inquiry',
    interaction_type: 'Form Submit',
    status:           'New'
  },
  cookie_consent: {
    lead_type:        'Cookie Accept',
    lead_source:      'Website Organic',
    interaction_type: 'Cookie Accept',
    status:           'New'
  }
};

export const LEGACY_MAP = {
  lead_type: {
    'Website Visitor': 'Cookie Accept',
    'Cookie Consent':  'Cookie Accept'
  },
  lead_source: {
    'Collection':      'Website Organic',
    'Organic':         'Website Organic',
    'Portrait Page':   'Portrait Inquiry'
  },
  interaction_type: {
    'NFS Page View':   'Page View',
    'Collection View': 'Page View',
    'Exhibition View': 'Page View'
  }
};
