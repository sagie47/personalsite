
import { BlogPost, Project, Book } from "./types";

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "The Real AI Revolution Is Answering the Phone",
    date: "2025-01-13",
    content: `# The Real AI Revolution Is Answering the Phone

The loudest debates about artificial intelligence are still conducted in abstractions: whether models will become conscious, whether "AGI" is close, whether the new machines will rescue us or ruin us. Meanwhile, a quieter revolution is spreading through places that don't sound like the future—plumbing vans, dental front desks, HVAC dispatch boards—where the problem isn't intelligence at all.

It's contact.

In local services, the most consequential failure mode is embarrassingly simple: the phone rings, nobody answers, and the customer moves on. The point-of-sale is a human being who can't pick up while under a sink, on a roof, or in a treatment room. And unlike a neglected email thread, a missed call is often unrecoverable. Call analytics data from Invoca suggests home services businesses miss roughly 27% of inbound calls.

The popular story says AI will first transform the office—copywriting, slide decks, email. The story in the trades is different. Here, AI is not a writing assistant. It is a thin operational layer that routes, books, confirms, and follows up: the scaffolding of revenue.

### The Missed-Call Economy

Vendor decks love to cite breathless numbers—six figures "lost" to missed calls—because big numbers sell. A better way to understand the incentive is to do the kind of napkin math an operator would actually trust.

Start with two conservative facts. First: the missed-call rate is real. As noted, industry data puts it at around 27% for home services. Second: voicemail is not a safety net. Reports indicate that less than 3% of callers who reach voicemail leave a message. In other words, the "we'll call them back" plan usually depends on a message that never arrives.

Now translate that into a small shop.

Imagine a two-truck HVAC business. Miss two calls a day—one at lunch, one after hours. Over a working year, that's roughly 500 missed calls. Not every call is a real lead; benchmarks suggest about 47% of calls are leads, and about 29% of those leads convert. Even if you treat those as rough figures and apply them conservatively, you get a meaningful number of jobs that never exist.

And in these businesses, the stakes are unusually high per interaction. A single booked job is not a "conversion" on a dashboard; it's a technician, a route, an invoice, a review, a repeat customer, a referral network. The missed call is a small failure that compounds.

Dentistry and other high-lifetime-value practices are a variation on the same theme: fewer calls, higher stakes, and a front desk that becomes the bottleneck. The exact dollar figure will vary wildly by practice and case mix, which is why the most honest claim here is not "AI adds $X." It's that responsiveness itself is a revenue system—and most small businesses run it on luck.

### The Silent Tech Stack

The tools that matter in this world are not the general-purpose models that dominate the headlines. They are narrower systems, designed to live inside the shop's actual workflow: calendars, dispatch, intake, and billing.

Jobber, a widely used operations platform in home services, now markets an AI Receptionist that can handle calls and texts, schedule jobs, and create requests from the same dashboard operators already use. Smith.ai, another player, sells an "AI receptionist" model with 24/7 coverage and the ability to screen leads and route calls, with escalation to humans when needed.

On the heavier end of the market, ServiceTitan—an operating system for larger trades businesses—has pushed deeper into AI as part of what it calls "Titan Intelligence," announcing Atlas, a new interface layer aimed at automating back-office work "from the first call to the final invoice."

What's striking is not that these products exist; it's where they sit. They live in the thin seam between customer intent and operational reality: "Can you come today?" "What's the next available slot?" "Is this an emergency?" "Do you serve my area?" That seam is where small businesses bleed time, attention, and money.

This is why the "future of work" story looks different outside the office. In a plumbing business, the point is not to generate better prose. It is to reduce the number of times a skilled person has to stop a skilled task to do a low-skill one. Every minute a technician spends triaging voicemail is a minute they aren't producing billable work.

### Why "Plug and Play" Is a Lie

If the economics are so obvious, why isn't every shop doing this?

Because buying software is easy. Installing it into messy reality is the hard part.

Small and medium-size firms routinely cite skills and capability gaps as a major barrier to AI adoption. Canada's Innovation, Science and Economic Development department summarizes an OECD survey across G7 countries in which 50% of SMEs reported a lack of skills as an impediment to adoption. Similarly, a CFIB report found that while most small businesses use digital tools, only a small minority have fully integrated them across operations—an important distinction between "we tried a tool" and "the tool actually runs part of the business."

That gap—between tool and workflow—is where most "AI projects" go to die. And it's where a new kind of work quietly emerges: not prompt engineering, but operations architecture.

There are three predictable failure modes.

**Spam and noise.** A naïve answering agent will cheerfully pick up robocalls and wrong numbers and burn budget and attention. If you've ever watched a small business phone line, you know how much of it is junk. The fix is rarely glamorous: filtering, routing rules, gating prompts, business-hours logic, and escalation paths that keep the system from being exploited.

**Overpromising.** AI systems are good at sounding confident. That's a problem when the system's job is to make commitments—time slots, pricing, availability. The "$1 Tahoe" episode, when a user coaxed a Chevrolet dealership chatbot into agreeing to an absurd offer, is a cheap meme with a serious lesson: unbounded assistants will say the wrong thing with perfect confidence. In services, the analog is simple: booking the wrong job, promising the wrong price, or telling an angry customer something that makes a bad situation worse. The fix is "trust budgeting": strict permissions, safe defaults, and scripts that define what the agent may and may not commit to.

**Integration.** A receptionist that cannot see the schedule is just a talking machine. In the average SMB, the calendar lives in one place, billing in another, customer history in a third. This is why "AI" doesn't feel like magic in real businesses until it's connected to the underlying systems. Sometimes that means using the integrations vendors already provide; Smith.ai, for example, logs call details directly into ServiceTitan. Sometimes it means building glue—lightweight automations that turn a conversation into a calendar block, a ticket, a quote request, or a follow-up task.

None of this is as cinematic as "AGI." But it changes what work is. It shifts the burden from constant interruption to structured flow. It reduces the number of times a human has to serve as a router for information.

### The Split That Matters

There's a popular narrative that AI will widen the advantage of big companies over small ones. In practice, the first-order effect may be a different split: between organizations that can integrate tools into workflow and those that cannot.

Large enterprises are often cautious for rational reasons—compliance, security, procurement, data governance. But their constraints also create latency. Smaller firms, by contrast, can decide quickly and ship changes into the real world without a committee. In local services, "implementation" can mean something as simple—and as valuable—as reliably answering calls and turning intent into booked work.

That is what makes this moment feel like an inflection point. Not the arrival of new intelligence, but the spread of new coordination.

The technology is here. The bottleneck isn't intelligence.

It's integration.
`
  },
  {
    id: 2,
    title: "Retro Aesthetics",
    date: "2023-11-02",
    content: `# Why Retro?

Modern interfaces are fluid, smooth, and often *boring*.

We yearn for the tactile feel of:
- Mechanical keyboards
- CRT scanlines
- The raw command line

**Limitation breeds creativity.** When you only have 80 columns and 25 rows, every character counts.
`
  },
  {
    id: 3,
    title: "Future Plans",
    date: "2023-12-10",
    content: `# Looking Ahead

I plan to build more tools that bridge the gap between:
- The nostalgia of the past
- The power of the future

Stay tuned. The *revolution* will be text-based.
`
  }
];

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Neon Vengeance",
    description: "A top-down shooter game engine built with React and Canvas. Features AI pathfinding, dynamic lighting, and particle systems.",
    techStack: ["React", "HTML5 Canvas", "Typescript"],
    year: "2024",
    isFeatured: true
  },
  {
    id: 2,
    title: "GrooveStation 95",
    description: "Web-based synthesizer and drum machine. Uses the Web Audio API to generate waveforms and effects in real-time.",
    techStack: ["Web Audio API", "React", "CSS Grid"],
    year: "2023",
    isFeatured: true
  },
  {
    id: 3,
    title: "Terminal Portfolio",
    description: "A recursive CLI environment that mimics MS-DOS. You are using it right now.",
    techStack: ["React", "Tailwind", "System_OS"],
    year: "2024",
    isFeatured: false
  },
  {
    id: 4,
    title: "LoveLink API",
    description: "A matching algorithm backend for a 90s themed dating simulation.",
    techStack: ["Node.js", "Express", "PostgreSQL"],
    year: "2023",
    isFeatured: false
  }
];

export const BOOKS: Book[] = [
    {
        id: 1,
        title: "Freedom from the Known",
        author: "Jiddu Krishnamurti",
        year: "1969",
        rating: 5,
        thoughts: "A critical investigation into how past conditioning shapes immediate reactions. I am using this text to better understand the mechanism of fear and authority within my own mind, and to learn how to observe my thoughts without immediately acting on them.",
        color: "#94a3b8", // Slate 400
        spineColor: "#1e293b", // Slate 800
        height: "h-24",
        width: "w-8",
        coverImage: '/book/freedom.jpeg',
    },
    {
        id: 2,
        title: "The Untethered Soul",
        author: "Michael A. Singer",
        year: "2007",
        rating: 5,
        thoughts: "This book has been instrumental in teaching me the concept of 'witness consciousness'—the ability to step back and watch the voice in my head rather than identifying with it. It is a practical guide for not letting temporary emotions dictate permanent behavior.",
        color: "#facc15", // Yellow 400
        spineColor: "#854d0e", // Yellow 900
        height: "h-26",
        width: "w-9",
        coverImage: '/book/Generated Image January 13, 2026 - 1_07PM.jpeg',
    },
    {
        id: 3,
        title: "Man's Search for Meaning",
        author: "Viktor Frankl",
        year: "1946",
        rating: 5,
        thoughts: "Frankl’s philosophy on 'the last of the human freedoms'—the ability to choose one's attitude in any given set of circumstances. Essential reading for maintaining dignity, purpose, and responsibility regardless of the environment I find myself in.",
        color: "#3730a3", // Indigo 800
        spineColor: "#e0e7ff", // Indigo 100
        height: "h-22",
        width: "w-8",
        coverImage: '/book/mans.jpeg',
    },
    {
        id: 4,
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        year: "2011",
        rating: 5,
        thoughts: "A study of the two systems that drive the way we think: System 1 (fast, impulsive) and System 2 (slow, deliberative). I am studying this to recognize when I am operating in System 1 so I can pause and engage the rational checks of System 2.",
        color: "#c2410c", // Orange 700
        spineColor: "#ffedd5", // Orange 100
        height: "h-32",
        width: "w-10",
        coverImage: '/book/thinking.jpeg',
    },
    {
        id: 5,
        title: "Atomic Habits",
        author: "James Clear",
        year: "2018",
        rating: 4,
        thoughts: "Moving away from goal-setting and focusing on system-building. I am applying these principles to create a rigid, positive daily routine. The focus is on small, incremental improvements to lifestyle rather than drastic shifts.",
        color: "#fbbf24", // Amber 400
        spineColor: "#78350f", // Amber 900
        height: "h-28",
        width: "w-9",
        coverPrompt: "A minimalist pixel art image showing upward progress. A staircase is being formed by stacking small, single green pixel blocks one on top of another, leading towards a star icon at the top right. The aesthetic is retro 8-bit, clean lines, bright green and white palette."
    },
    {
        id: 6,
        title: "Behave",
        author: "Robert Sapolsky",
        year: "2017",
        rating: 5,
        thoughts: "A scientific look at the neurobiology of humans at our best and worst. It helps me view behavior not just as 'willpower,' but as a biological process involving stress, environment, and neurochemistry that can be managed and regulated.",
        color: "#1e293b", // Slate 800
        spineColor: "#cbd5e1", // Slate 300
        height: "h-36",
        width: "w-11",
        coverImage: '/book/behave.jpeg',
    },
    {
        id: 7,
        title: "Deep Learning with Python",
        author: "François Chollet",
        year: "2017",
        rating: 5,
        thoughts: "Technical reference for my current work in neural network architecture. Focusing on maintaining a high level of technical competency to ensure long-term employability in the AI sector.",
        color: "#dc2626", // Red 600
        spineColor: "#fee2e2", // Red 100
        height: "h-30",
        width: "w-10",
        coverPrompt: "A pixel art cover representing technology. A simple diagram of a neural network made of glowing green pixel nodes connected by lines against a dark background. It looks like a retro computer interface. 8-bit style, monochrome green monitor aesthetic."
    },
    {
        id: 8,
        title: "Life 3.0",
        author: "Max Tegmark",
        year: "2017",
        rating: 4,
        thoughts: "Exploring the alignment problem and the future of safe AI systems. Keeps my focus on the macro-ethics of technology and the long-term future of the industry I work in.",
        color: "#2563eb", // Blue 600
        spineColor: "#dbeafe", // Blue 100
        height: "h-28",
        width: "w-9",
        coverImage: '/book/life.jpeg',
    },
    {
        id: 9,
        title: "Meditations",
        author: "Marcus Aurelius",
        year: "180 AD",
        rating: 5,
        thoughts: "My daily grounding text. A reminder that while I cannot control external events or legal outcomes, I have absolute control over my own character and composure.",
        color: "#78350f", // Amber 900 (Leather)
        spineColor: "#fcd34d", // Amber 300
        height: "h-20",
        width: "w-7",
        coverImage: '/book/meditations.jpeg',
    }
];

export const DEFAULT_ABOUT = `I love mapping messy human problems into clean, usable software.`;

export const ASCII_ART = `
 _____/\\\\\\\\\\\\\\_______/\\\\\\\\\\\\\\_____/\\\\\\_____/\\\\\\______/\\\\\\\\\\\\\\\\\\\\\\_        
 ___/\\\\\\/////////\\\\\\___/\\\\\\\\\\\\\\\\\\\\\\\\\__\\/\\\\\\\\___\\/\\\\\\_____\\/////\\\\\\///__       
  __\\//\\\\\\______\\///___/\\\\\\/////////\\\\\\_\\/\\\\\\/\\\\\\__\\/\\\\\\_________\\/\\\\\\_____      
   ___\\////\\\\\\_________\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\//\\\\\\_\\/\\\\\\_________\\/\\\\\\_____     
    ______\\////\\\\\\______\\/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\\\//\\\\\\\\/\\\\\\_________\\/\\\\\\_____    
     _________\\////\\\\\\___\\/\\\\\\/////////\\\\\\_\\/\\\\\\_\\/\\\\\\/\\\\\\_________\\/\\\\\\_____   
      __/\\\\\\______\\//\\\\\\__\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\__\\//\\\\\\\\\\\\__/\\\\\\___\\/\\\\\\_____  
       _\\///\\\\\\\\\\\\\\\\\\\\\\/___\\/\\\\\\_______\\/\\\\\\_\\/\\\\\\___\\//\\\\\\\\\\_\\//\\\\\\\\\\\\\\\\\\______ 
        ___\\///////////_____\\///________\\///__\\///_____\\/////___\\/////////_______
`;

export const WELCOME_MESSAGE = `
Welcome to SYSTEM_OS [Version 1.0.4]
(c) 2024 Sanj Corp. All rights reserved.

Type 'help' to see available commands.
`;

export const ALIEN_CHARS = "░▒▓█▀▄▌▐►◄▲▼♦♣♠♥";
