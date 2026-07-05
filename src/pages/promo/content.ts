// ─────────────────────────────────────────────────────────────────────────────
// Edit this file to update all content on the promo page.
// No styling or component knowledge required.
//
// Image paths: put files in public/img/ and reference them as '/img/filename.ext'
// Supported formats: jpg, jpeg, png, webp, avif, svg
// ─────────────────────────────────────────────────────────────────────────────

export const nav = {
  links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'In the Wild', href: '#wild' },
    { label: 'PWA', href: '#pwa' },
    { label: 'FAQ', href: '#faq' },
  ],
  cta: { label: 'Open App', href: 'https://hehechat.io' },
};

export const hero = {
  eyebrow: 'The Streaming Companion',
  // Last item in this array is rendered in pink gradient
  headline: ['Every Chat. Every Alert.', 'Always in Time.'],
  subline:
    'Never miss donations, TTS, Blerps or chat messages again. HeheChat orchestrates every stream event - others just receive them.',
  // Set to an image path like '/screenshots/hero.png' when ready
  image: undefined,
  buttons: [
    { label: 'Open HeheChat', href: 'https://hehechat.io', variant: 'primary' as const },
    { label: 'Join Discord', href: 'https://discord.gg/fMRACPqNhD', variant: 'outline' as const },
  ],
};

export const features = {
  eyebrow: 'Why HeheChat',
  headline: ['Reliable IRL chat and alerts', 'With full control instead of chaos'],
  tiles: [
    {
      title: 'Built for IRL',
      desc: 'Lightweight and mobile-ready. Monitor your stream from anywhere.',
      dark: false,
      bg: '#f5f5f5',
      image: '/img/tile_irl.jpg',
    },
    {
      title: 'Replay Missed Alerts',
      desc: 'Missed a donation mid-hype? Replay any past alert instantly.',
      dark: true,
      bg: '#120820',
      // ponytail: CSS gradient stands in until a real screenshot is available
      image: '/img/tile_replay.png',
    },
        {
      title: 'Shared Chat',
      desc: 'Multiple streamers, one shared view. Built for co-streams.',
      dark: false,
      bg: '#120820',
      image: '/img/tile_together.jpg',
    },
    {
      title: 'Unified Alert Queue',
      desc: 'Donations, TTS, Blerps, follows — one sequential queue.',
      dark: true,
      bg: '#0d0d0d',
      image: undefined as string | undefined,
      scatterLogos: true,
    },
  ],
};

export const carousel = {
  eyebrow: 'Community',
  headline: 'HeheChat in the Wild',
  /** Each slide pairs a photo with a testimonial shown below it. */
  slides: [
    {
      video: '/img/slide_moritz.mp4',
      quote: 'Ich nutze HeheChat seit über einem Jahr als IRL Chat App und um meine IRL Alerts abzuspielen. Die Kombination aus Alerts und Chat App habe ich in diesem Umfang noch nirgends gesehen. Gerade die Möglichkeit Alerts ein zweites mal abzuspielen macht es für mich noch angenehmer in IRL Streams mit meiner Community zu interagieren.',
      author: 'Moritz - Youtube & Snowboard Legend',
      channel: 'twitch.tv/moritzschmid1',
    },
    {
      video: '/img/slide_knirpz.mp4',
      quote: 'Für mich ist HeheChat sehr übersichtlich und intuitiv. Ich kann das Design schnell und einfach an meine Umgebung anpassen. Dank der vielen Anpassungsmöglichkeiten kann ich meine Zuschauer noch mehr Teil des Geschehens werden lassen, was mich manchmal meinen Lebenssinn hinterfragen lässt.',
      author: 'Knirpz - Twitch Ambassador',
      channel: 'twitch.tv/knirpz',
    },
        {
      video: '/img/slide_minuself.mp4',
      quote:
        undefined,//'Ich kann das alles nicht mehr',
      author: 'MinusElf - IRL Streamerin',
      channel: 'twitch.tv/minuself',
    },
    {
      video: '/img/slide_jonsman.mp4',
      quote:
        undefined,//"I run co-streams every week. Shared sessions make it feel like we're all in the same room.",
      author: 'Jonsman - IRL Streamer',
      channel: 'twitch.tv/jonsman',
    },
  ],
};

export const services = {
  eyebrow: 'Integrations',
  headline: 'Works with the services you already use.',
  items: [
    { name: 'Twitch', color: '#9146FF' },
    { name: 'YouTube', color: '#FF0000' },
    { name: '7TV', color: '#29b6ac' },
    { name: 'StreamElements', color: '#F26522' },
    { name: 'SoundAlerts', color: '#FF4D6D' },
    { name: 'Blerp', color: '#00C9A7' },
    { name: 'Ko-fi', color: '#DB32BC' },
    { name: 'ElevenLabs', color: '#ffffff' },
    { name: 'Pally', color: '#ffffff' },
  ],
};

export const pricing = {
  eyebrow: 'Pricing',
  headline: 'Free to use. Pro to level up.',
  tiers: [
    {
      name: 'Free',
      price: '€0',
      desc: 'Everything you need to run alerts and chat during a stream — no catch, no time limit.',
      features: [
        'Read Twitch Chat',
        'Build and play alerts',
        'Unified alert queue (donations, TTS, Blerps, follows)',
        'Replay missed alerts',
        'Twitch video player',
        '7TV integration',
        'Shared sessions for co-streams',
        'Chat with unlimited channels',
        'Regular chat notifications',
        'Community Discord support',
      ],
    },
    {
      name: 'Pro',
      price: '$1',
      period: '= 10 days',
      desc: 'Support HeheChat and unlock automation and insights for as long as you like — $1 buys 10 days of Pro.',
      features: [
        'Everything in Free',
        'OBS scene switcher automation',
        'Extended Notifications',
        'Premium TTS voices',
        'Chat Pro badge',
      ],
      highlight: true,
    },
  ],
};

export const faq = {
  eyebrow: 'FAQ',
  headline: 'Questions? Answered.',
  items: [
    {
      question: 'Where can I download it?',
      answer:
        'There’s nothing to download — HeheChat is a Progressive Web App. Just open hehechat.io in your browser and, if you like, use your browser’s "Add to Home Screen" / "Install App" option to get it as an app icon on your phone, tablet, or desktop. No app store, no update hassle.',
    },
    {
      question: 'Can I use my StreamElements alerts?',
      answer:
        'Not as-is, sorry — StreamElements alerts are built for IRL streaming setups and don’t translate 1:1 into HeheChat. The good news: you don’t have to start from scratch. HeheChat ships with an alert template that fits most setups out of the box, and you can fully customize it to match your style. If you get stuck, our [Discord](https://discord.gg/fMRACPqNhD) is happy to help.',
    },
    {
      question: 'I have problems / alerts don’t work',
      answer:
        'That happens sometimes, and we’re here to help — hop into our [Discord](https://discord.gg/fMRACPqNhD) and describe what you’re seeing. The community and team are usually quick to jump in and get you sorted.',
    },
    {
      question: 'How do I stream with others?',
      answer:
        'Co-streaming is easy: both of you log into HeheChat, then each add both channel names under Channel settings. That gives you a combined chat view instantly, and you can optionally share alerts too so everyone sees the same hype in real time.',
    },
    {
      question: 'I need an integration for another service',
      answer:
        'We’d love to hear about it! Swing by our [Discord](https://discord.gg/fMRACPqNhD) and tell us what you’re trying to connect — we’re always looking for what to build next.',
    },
  ],
};

export const pwa = {
  eyebrow: 'Progressive Web App',
  headline: 'One app. Every device.',
  subline:
    'No app store. No installations. HeheChat lives in your browser — and installs like a native app on any platform.',
  bullets: [
    'Configure once, use everywhere',
    'Install as PWA — no app store required',
    'Works on desktop, tablet, and mobile',
  ],
  cta: { label: 'Open HeheChat', href: 'https://hehechat.io' },
};

export const footer = {
  copyright: 'HeheChat. All rights reserved.',
};
