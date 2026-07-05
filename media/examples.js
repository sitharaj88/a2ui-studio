// Example gallery for A2UI Studio.
// "demo" entries carry a prerecorded A2UI v0.9.1 stream that renders locally
// with zero AI setup; "prompt" entries are sent to the configured provider.
(function () {
  const CATALOG = 'https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json';

  const contactFormDemo = [
    { version: 'v0.9.1', createSurface: { surfaceId: 'demo_contact_form', catalogId: CATALOG, sendDataModel: true, theme: { primaryColor: '#6C8EEF', agentDisplayName: 'Demo Agent' } } },
    {
      version: 'v0.9.1',
      updateComponents: {
        surfaceId: 'demo_contact_form',
        components: [
          { id: 'root', component: 'Card', child: 'form_col' },
          { id: 'form_col', component: 'Column', children: ['header_row', 'subtitle', 'div1', 'name_row', 'email_field', 'topic_picker', 'msg_field', 'news_check', 'submit_btn'] },
          { id: 'header_row', component: 'Row', children: ['header_icon', 'header_text'], align: 'center' },
          { id: 'header_icon', component: 'Icon', name: 'mail' },
          { id: 'header_text', component: 'Text', text: 'Contact us', variant: 'h2' },
          { id: 'subtitle', component: 'Text', text: 'We usually reply within one business day.', variant: 'caption' },
          { id: 'div1', component: 'Divider', axis: 'horizontal' },
          { id: 'name_row', component: 'Row', children: ['first_col', 'last_col'], justify: 'spaceBetween' },
          { id: 'first_col', component: 'Column', children: ['first_field'], weight: 1 },
          { id: 'first_field', component: 'TextField', label: 'First name', value: { path: '/contact/firstName' }, variant: 'shortText' },
          { id: 'last_col', component: 'Column', children: ['last_field'], weight: 1 },
          { id: 'last_field', component: 'TextField', label: 'Last name', value: { path: '/contact/lastName' }, variant: 'shortText' },
          {
            id: 'email_field', component: 'TextField', label: 'Email address', value: { path: '/contact/email' }, variant: 'shortText',
            checks: [
              { call: 'required', args: { value: { path: '/contact/email' } }, message: 'Email is required.' },
              { call: 'email', args: { value: { path: '/contact/email' } }, message: 'Please enter a valid email address.' }
            ]
          },
          {
            id: 'topic_picker', component: 'ChoicePicker', label: 'Topic', variant: 'mutuallyExclusive',
            options: [
              { label: 'Support', value: 'support' },
              { label: 'Sales', value: 'sales' },
              { label: 'Feedback', value: 'feedback' }
            ],
            value: { path: '/contact/topic' }
          },
          { id: 'msg_field', component: 'TextField', label: 'How can we help?', value: { path: '/contact/message' }, variant: 'longText' },
          { id: 'news_check', component: 'CheckBox', label: 'Send me occasional product updates', value: { path: '/contact/subscribe' } },
          { id: 'submit_label', component: 'Text', text: 'Send message' },
          {
            id: 'submit_btn', component: 'Button', child: 'submit_label', variant: 'primary',
            action: { event: { name: 'submitContactForm', context: { email: { path: '/contact/email' }, topic: { path: '/contact/topic' }, message: { path: '/contact/message' } } } }
          }
        ]
      }
    },
    {
      version: 'v0.9.1',
      updateDataModel: {
        surfaceId: 'demo_contact_form', path: '/contact',
        value: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', topic: ['support'], message: '', subscribe: true }
      }
    }
  ];

  const travelDemo = [
    { version: 'v0.9.1', createSurface: { surfaceId: 'demo_trip_explorer', catalogId: CATALOG, sendDataModel: true, theme: { primaryColor: '#22B8A0', agentDisplayName: 'Trip Explorer' } } },
    {
      version: 'v0.9.1',
      updateComponents: {
        surfaceId: 'demo_trip_explorer',
        components: [
          { id: 'root', component: 'Card', child: 'main_col' },
          { id: 'main_col', component: 'Column', children: ['hdr_row', 'hero_caption', 'tabs'] },
          { id: 'hdr_row', component: 'Row', children: ['hdr_icon', 'hdr_text'], align: 'center' },
          { id: 'hdr_icon', component: 'Icon', name: 'locationOn' },
          { id: 'hdr_text', component: 'Text', text: 'Weekend in Kyoto', variant: 'h2' },
          { id: 'hero_caption', component: 'Text', text: { call: 'formatString', args: { value: 'Curated for ${/trip/travelers} travelers · budget ${/trip/budget} USD' } }, variant: 'caption' },
          { id: 'tabs', component: 'Tabs', tabs: [ { title: 'Highlights', child: 'highlights_list' }, { title: 'Plan', child: 'plan_col' } ] },
          { id: 'highlights_list', component: 'List', children: { path: '/trip/highlights', componentId: 'highlight_tpl' }, direction: 'vertical' },
          { id: 'highlight_tpl', component: 'Column', children: ['hl_row', 'hl_desc', 'hl_div'] },
          { id: 'hl_row', component: 'Row', children: ['hl_icon', 'hl_name', 'hl_rating'], align: 'center', justify: 'spaceBetween' },
          { id: 'hl_icon', component: 'Icon', name: 'star' },
          { id: 'hl_name', component: 'Text', text: { path: 'name' }, variant: 'h4', weight: 1 },
          { id: 'hl_rating', component: 'Text', text: { path: 'rating' }, variant: 'caption' },
          { id: 'hl_desc', component: 'Text', text: { path: 'description' }, variant: 'body' },
          { id: 'hl_div', component: 'Divider', axis: 'horizontal' },
          { id: 'plan_col', component: 'Column', children: ['travelers_slider', 'budget_slider', 'date_input', 'ryokan_check', 'plan_btn'] },
          { id: 'travelers_slider', component: 'Slider', label: 'Travelers', min: 1, max: 8, value: { path: '/trip/travelers' } },
          { id: 'budget_slider', component: 'Slider', label: 'Budget (USD)', min: 200, max: 5000, value: { path: '/trip/budget' } },
          { id: 'date_input', component: 'DateTimeInput', value: { path: '/trip/startDate' }, enableDate: true, enableTime: false },
          { id: 'ryokan_check', component: 'CheckBox', label: 'Include a ryokan stay', value: { path: '/trip/ryokan' } },
          { id: 'plan_btn_label', component: 'Text', text: 'Build my itinerary' },
          {
            id: 'plan_btn', component: 'Button', child: 'plan_btn_label', variant: 'primary',
            action: { event: { name: 'buildItinerary', context: { travelers: { path: '/trip/travelers' }, budget: { path: '/trip/budget' }, startDate: { path: '/trip/startDate' }, ryokan: { path: '/trip/ryokan' } } } }
          }
        ]
      }
    },
    {
      version: 'v0.9.1',
      updateDataModel: {
        surfaceId: 'demo_trip_explorer', path: '/trip',
        value: {
          travelers: 2, budget: 1800, startDate: '2026-08-14', ryokan: true,
          highlights: [
            { name: 'Fushimi Inari at dawn', rating: '4.9 ★', description: 'Walk the vermilion torii gates before the crowds arrive.' },
            { name: 'Arashiyama bamboo grove', rating: '4.7 ★', description: 'Towering bamboo with a stop at Tenryu-ji temple gardens.' },
            { name: 'Nishiki Market tasting', rating: '4.8 ★', description: 'Five-block food walk: yuba, matcha warabi mochi, tamagoyaki.' }
          ]
        }
      }
    }
  ];

  window.A2UI_EXAMPLES = [
    {
      id: 'demo-contact',
      icon: 'mail',
      title: 'Contact form',
      desc: 'Instant demo — validation, choice picker, two-way binding. No AI setup needed.',
      badge: 'Instant demo',
      demo: contactFormDemo
    },
    {
      id: 'demo-travel',
      icon: 'locationOn',
      title: 'Trip explorer',
      desc: 'Instant demo — tabs, templated lists, sliders, formatString bindings.',
      badge: 'Instant demo',
      demo: travelDemo
    },
    {
      id: 'p-restaurant',
      icon: 'search',
      title: 'Restaurant finder',
      desc: 'Search filters, a templated result list with ratings, and a reserve action.',
      prompt: 'A restaurant finder: a search text field, a cuisine ChoicePicker (Italian, Japanese, Mexican, Indian), a price Slider, and a templated list of 4 sample restaurant results each with name, rating, description and a "Reserve" button. Seed realistic sample data.'
    },
    {
      id: 'p-survey',
      icon: 'thumbUp',
      title: 'Feedback survey',
      desc: 'Multi-question survey with sliders, choices and a validated submit.',
      prompt: 'A product feedback survey: NPS slider 0-10, a multiple-selection ChoicePicker of favorite features, a long-text comments field, an email field with validation, and a primary submit button that sends all answers in its action context.'
    },
    {
      id: 'p-product',
      icon: 'shoppingCart',
      title: 'Product page',
      desc: 'Image, price, options, quantity and add-to-cart round-trip.',
      prompt: 'A product detail card for premium wireless headphones: product image (use https://picsum.photos/seed/headphones/640/360), title, price, a short description, a color ChoicePicker, a quantity slider 1-5, and an "Add to cart" primary button sending the selection in context. Seed the data model.'
    },
    {
      id: 'p-rsvp',
      icon: 'event',
      title: 'Event RSVP',
      desc: 'Date input, guest count, dietary choices, and an RSVP action.',
      prompt: 'An event RSVP card for a rooftop launch party: event details header, DateTimeInput for arrival, guest count slider, dietary preference ChoicePicker, a CheckBox for +1, and an RSVP primary button. Validate that a date is chosen.'
    },
    {
      id: 'p-dashboard',
      icon: 'settings',
      title: 'Settings panel',
      desc: 'Tabs with profile, notifications and appearance settings.',
      prompt: 'A settings panel with Tabs: "Profile" (name/email TextFields), "Notifications" (three CheckBoxes), "Appearance" (theme ChoicePicker with Light/Dark/System, font size slider). Include a Save button that sends everything, and seed sensible defaults.'
    },
    {
      id: 'p-quiz',
      icon: 'help',
      title: 'Pop quiz',
      desc: 'A themed multi-question quiz with a submit round-trip.',
      prompt: 'A 3-question pop quiz about space exploration using mutually-exclusive ChoicePickers, a progress caption, and a "Check answers" primary button that sends the selected answers. Make it fun with icons.'
    },
    {
      id: 'p-recipe',
      icon: 'favorite',
      title: 'Recipe card',
      desc: 'Templated ingredients list, servings slider that feeds bindings.',
      prompt: 'A recipe card for shakshuka: hero image (https://picsum.photos/seed/shakshuka/640/320), a servings slider, a templated ingredients list from the data model, step-by-step instructions in a second tab, and a "Start cooking" button.'
    }
  ];
})();
