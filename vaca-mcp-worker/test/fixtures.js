/**
 * VaCa MCP Worker — Test Fixtures (all 20)
 * F01-F07: happy path + enum normalization
 * F08-F13: validation rejections
 * F14-F15: field aliasing
 * F16-F20: routing matrix
 */

export const fixtures = [

  // F01 WhatsApp Hot Lead
  {
    id: 'F01',
    name: 'WhatsApp hot lead — score 8, routes to leads_crm + alert',
    source: 'whatsapp',
    payload: {
      source_page:      'https://vacamarquetry.shop/artworks/the-sovereign.html',
      artwork_context:  'The Sovereign',
      intent_score:     8,
      incoming_message: 'I am very interested in The Sovereign.',
      submitted_at:     '2026-06-29T10:00:00.000Z'
    },
    expected: {
      lead_type:   'WhatsApp Lead',
      lead_source: 'WhatsApp',
      lead_heat:   '🔥 Hot',
      routing:     'leads_crm',
      alert:       true
    }
  },

  // F02 Artwork Inquiry Standard
  {
    id: 'F02',
    name: 'Artwork inquiry — valid full payload, Warm routing',
    source: 'artwork_inquiry',
    payload: {
      name:          'Marco Rossi',
      email:         'marco@example.com',
      message:       'I am interested in this piece.',
      artwork_title: 'King of Ararat',
      artwork_slug:  'king-of-ararat',
      artwork_url:   'https://vacamarquetry.shop/artworks/king-of-ararat.html'
    },
    expected: {
      lead_type:        'Artwork Inquiry',
      lead_source:      'Artwork Page',
      interaction_type: 'Form Submit',
      routing:          'leads_crm'
    }
  },

  // F03 Portrait Inquiry Hot
  // base=2 + portrait_bonus=3 + budget_bonus=2 = 7 -> Hot
  {
    id: 'F03',
    name: 'Portrait inquiry with budget — score 7, Hot, collector_crm',
    source: 'portrait_inquiry',
    payload: {
      name:         'Sophie Laurent',
      email:        'sophie@example.com',
      subject_type: 'Family portrait',
      portrait_size:'90x120',
      budget:       '3500',
      occasion:     'Anniversary',
      intent_score: 2,
      source_page:  'https://vacamarquetry.shop/custom-portraits.html'
    },
    expected: {
      lead_type:           'Portrait Inquiry',
      lead_source:         'Portrait Inquiry',
      intent_score_scaled: 7,
      lead_heat:           '🔥 Hot',
      routing:             'collector_crm',
      alert:               true
    }
  },

  // F04 Contact Standard
  {
    id: 'F04',
    name: 'Contact form — valid payload, standard routing',
    source: 'contact',
    payload: {
      name:        'David Chen',
      email:       'david@gallery.com',
      message:     'I would like to discuss a gallery partnership.',
      source_page: 'https://vacamarquetry.shop/contact.html'
    },
    expected: {
      lead_type:        'Contact',
      lead_source:      'Contact Form',
      interaction_type: 'Contact Form',
      routing:          'leads_crm',
      alert:            false
    }
  },

  // F05 Cookie Low Intent
  {
    id: 'F05',
    name: 'Cookie consent — score 1, routes to analytics_only',
    source: 'cookie_consent',
    payload: {
      visitor_id:    'v-abc-123',
      session_id:    's-def-456',
      intent_score:  1,
      device_type:   'Mobile',
      browser:       'Safari',
      os:            'iOS',
      pages_visited: 2,
      source_page:   'https://vacamarquetry.shop/'
    },
    expected: {
      lead_type:        'Cookie Accept',
      lead_source:      'Website Organic',
      interaction_type: 'Cookie Accept',
      routing:          'analytics_only'
    }
  },

  // F06 Legacy Enum: "Website Visitor" -> "Cookie Accept"
  {
    id: 'F06',
    name: 'Legacy enum — "Website Visitor" normalized to "Cookie Accept"',
    source: 'cookie_consent',
    payload: {
      visitor_id:   'v-legacy-001',
      session_id:   's-legacy-001',
      intent_score: 2,
      lead_type:    'Website Visitor'
    },
    expected: {
      lead_type:   'Cookie Accept',
      lead_source: 'Website Organic'
    }
  },

  // F07 Legacy Enum: "Organic" -> "Website Organic"
  {
    id: 'F07',
    name: 'Legacy enum — "Organic" lead_source normalized to "Website Organic"',
    source: 'cookie_consent',
    payload: {
      visitor_id:   'v-legacy-002',
      session_id:   's-legacy-002',
      intent_score: 3,
      lead_source:  'Organic'
    },
    expected: {
      lead_source: 'Website Organic'
    }
  },

  // F08 Reject: Bad Email
  {
    id: 'F08',
    name: 'Validation reject — bad email format',
    source: 'contact',
    payload: {
      name:        'Test User',
      email:       'bademail',
      message:     'This should be rejected.',
      source_page: 'https://vacamarquetry.shop/contact.html'
    },
    expectReject: true,
    expectedError: 'email'
  },

  // F09 Reject: Missing artwork_title
  {
    id: 'F09',
    name: 'Validation reject — artwork_inquiry missing artwork_title',
    source: 'artwork_inquiry',
    payload: {
      name:         'Maria Klein',
      email:        'maria@example.com',
      artwork_slug: 'the-sovereign'
    },
    expectReject: true,
    expectedError: 'artwork_title'
  },

  // F10 Reject: Missing source_page
  {
    id: 'F10',
    name: 'Validation reject — contact missing source_page',
    source: 'contact',
    payload: {
      name:    'No Page User',
      email:   'nopage@example.com',
      message: 'I forgot to send the source page.'
    },
    expectReject: true,
    expectedError: 'source_page'
  },

  // F11 Reject: Bad Slug
  {
    id: 'F11',
    name: 'Validation reject — artwork_slug with uppercase / spaces',
    source: 'artwork_inquiry',
    payload: {
      name:          'Slug Test',
      email:         'slug@example.com',
      artwork_title: 'The Sovereign',
      artwork_slug:  'The Sovereign'
    },
    expectReject: true,
    expectedError: 'artwork_slug'
  },

  // F12 Reject: intent_score out of range
  {
    id: 'F12',
    name: 'Validation reject — intent_score = 15 (out of range)',
    source: 'whatsapp',
    payload: {
      source_page:  'https://vacamarquetry.shop/',
      intent_score: 15
    },
    expectReject: true,
    expectedError: 'intent_score'
  },

  // F13 Reject: Portrait missing email
  {
    id: 'F13',
    name: 'Validation reject — portrait_inquiry missing email',
    source: 'portrait_inquiry',
    payload: {
      name: 'No Email Artist'
    },
    expectReject: true,
    expectedError: 'email'
  },

  // F14 Field Alias: source_url -> source_page
  {
    id: 'F14',
    name: 'Field alias — source_url accepted as source_page',
    source: 'whatsapp',
    payload: {
      source_url:       'https://vacamarquetry.shop/not-for-sale.html',
      incoming_message: 'Is the Arctic Eagle available?',
      intent_score:     5
    },
    expected: {
      source_page: 'https://vacamarquetry.shop/not-for-sale.html'
    }
  },

  // F15 Field Alias: artwork_context -> artwork_title
  // Scoring: base=6 + artwork_bonus=2 = 8 -> Hot
  {
    id: 'F15',
    name: 'Field alias — artwork_context aliased to artwork_title (score 8, Hot)',
    source: 'whatsapp',
    payload: {
      source_page:      'https://vacamarquetry.shop/artworks/arctic-eagle.html',
      artwork_context:  'Arctic Eagle',
      incoming_message: 'Want to buy this.',
      intent_score:     6
    },
    expected: {
      artwork_title: 'Arctic Eagle',
      lead_heat:     '🔥 Hot'
    }
  },

  // F16 Cookie High Intent -> leads_crm
  {
    id: 'F16',
    name: 'Cookie consent — score 5 (high intent), routes to leads_crm',
    source: 'cookie_consent',
    payload: {
      visitor_id:    'v-high-001',
      session_id:    's-high-001',
      intent_score:  5,
      device_type:   'Desktop',
      pages_visited: 6,
      time_on_site:  420,
      scroll_depth:  85
    },
    expected: {
      routing: 'leads_crm',
      alert:   false
    }
  },

  // F17 Portrait without budget -> Warm (0+3=3)
  {
    id: 'F17',
    name: 'Portrait inquiry no budget — score 3 (portrait bonus only), Warm',
    source: 'portrait_inquiry',
    payload: {
      name:  'Luca Ferrari',
      email: 'luca@example.com'
    },
    expected: {
      lead_heat: '🟡 Warm',
      routing:   'collector_crm',
      alert:     true
    }
  },

  // F18 Artwork Hot: 5 + artwork(2) + artwork_inquiry(1) = 8
  {
    id: 'F18',
    name: 'Artwork inquiry hot — intent=5 + artwork=2 + type=1 = 8, Hot',
    source: 'artwork_inquiry',
    payload: {
      name:          'Elena Ruiz',
      email:         'elena@art.com',
      artwork_title: 'King of Ararat',
      artwork_slug:  'king-of-ararat',
      intent_score:  5
    },
    expected: {
      intent_score_scaled: 8,
      lead_heat:           '🔥 Hot',
      routing:             'leads_crm',
      alert:               true
    }
  },

  // F19 Dead Letter via validator (whatsapp requires source_page)
  {
    id: 'F19',
    name: 'Reject — WhatsApp missing source_page (dead_letter path via validator)',
    source: 'whatsapp',
    payload: {
      intent_score: 3
    },
    expectReject: true,
    expectedError: 'source_page'
  },

  // F20 Legacy "Portrait Page" -> "Portrait Inquiry" (lead_source)
  {
    id: 'F20',
    name: 'Legacy enum — "Portrait Page" lead_source normalized to "Portrait Inquiry"',
    source: 'portrait_inquiry',
    payload: {
      name:        'Anna Petrov',
      email:       'anna@example.com',
      lead_source: 'Portrait Page'
    },
    expected: {
      lead_source: 'Portrait Inquiry'
    }
  }

];
