/**
 * Day-by-day copy for the quote & deposit follow-up drips (see
 * lib/followups/engine.ts for the sender). Every day says something genuinely
 * different — not the same paragraph with a new heading — because the whole
 * point is that it doesn't read like an automated sequence. SMS only exists
 * for days 1-5 (channel drops after that); WhatsApp is written to stand alone
 * with every detail a customer needs, since it's often the one they'll
 * actually act on.
 *
 * No fabricated testimonials or invented reviews anywhere here — the
 * "social proof" days link to the real Google review link instead.
 */

export interface FollowupVars {
  firstName: string;
  total: string;       // formatted, e.g. "£1,240.00"
  reference: string;
  actionLink: string;  // confirm-quote link, or pay link
  reviewLink: string;
  phone: string;
}

export interface DayContent {
  emailSubject: (v: FollowupVars) => string;
  /** Inner HTML paragraphs only — engine.ts wraps this in the shared branded shell. */
  emailBody: (v: FollowupVars) => string;
  /** Present only for days 1-5; plain text, kept short (normaliseSmsBody handles £/emoji/length). */
  sms?: (v: FollowupVars) => string;
  whatsapp: (v: FollowupVars) => string;
}

const p = (...lines: string[]) => lines.map((l) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">${l}</p>`).join("");

// ── QUOTE sequence — they haven't decided yet ──────────────────────────────
export const QUOTE_FOLLOWUP_DAYS: Record<number, DayContent> = {
  1: {
    emailSubject: (v) => `Any questions about your quote, ${v.firstName}?`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Just wanted to check the quote we sent over (ref ${v.reference}) made sense and covered everything you were expecting. Moving's stressful enough without a price that raises more questions than it answers — so if anything's unclear, or you'd just like to talk it through, reply to this email or give us a call.`,
      `No script, no pressure — just us.`
    ),
    sms: (v) => `Hi ${v.firstName}, it's Ample Removals. Any questions on the quote we sent? Happy to talk it through - ${v.phone}`,
    whatsapp: (v) => `Hi ${v.firstName}! Following up on your quote (ref ${v.reference}) for *${v.total}*. Totally happy to answer anything before you decide. You can confirm here whenever you're ready: ${v.actionLink}\n\nOr just call/message us on ${v.phone} - real people, not a call centre.`,
  },
  2: {
    emailSubject: (v) => `What's actually included in ${v.reference}`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Quick one — your price of <strong>${v.total}</strong> already covers a fully-insured, professional crew, the van, fuel and mileage, and careful loading and unloading. There's no "oh, that'll be extra" waiting for you on the day.`,
      `We'd rather you knew exactly what you're getting before you decide, not after.`
    ),
    sms: (v) => `Ample Removals: your quote (${v.total}, ref ${v.reference}) includes insured crew, van, fuel & careful handling - no hidden extras. ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}, quick note on what's included in your quote (ref ${v.reference}, *${v.total}*):\n\n✅ Fully insured, professional crew\n✅ Van, fuel & mileage\n✅ Careful loading & unloading\n✅ No hidden extras\n\nConfirm here whenever suits: ${v.actionLink}\nQuestions? Call/WhatsApp ${v.phone}.`,
  },
  3: {
    emailSubject: (v) => `${v.firstName}, the thing people tell us after a bad move`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `One thing we hear a lot from people who switch to us: they'd used a cheaper mover before and ended up with a scratched sofa, a missed time slot, or a crew that just didn't seem to care whether anything got damaged.`,
      `That's really the whole reason we run things the way we do — proper padding and protection on every item, and a team that treats your place like it's their own. Your quote (ref ${v.reference}) is still open whenever you're ready.`
    ),
    sms: (v) => `Hi ${v.firstName}, cheap movers can cost more in breakages. We're fully insured and careful with every item. Quote still open: ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}, we hear this a lot: people who used a cheaper mover last time ended up with damaged furniture or a crew that just didn't care.\n\nThat's the whole reason we do things properly - full insurance, real padding and protection, a crew that treats your things like their own.\n\nYour quote (ref ${v.reference}, *${v.total}*) is still open: ${v.actionLink}\nAny questions, just message us on ${v.phone}.`,
  },
  4: {
    emailSubject: (v) => `${v.firstName}, here's how simple moving day actually is`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `A lot of people assume booking a removal company means more admin for them. In practice it's the opposite — once your date's confirmed, our crew turns up, does the heavy lifting (literally), and you just point us in the right direction.`,
      `If you've got tricky access — stairs, a narrow doorway, tight parking — tell us and we'll plan around it. That's on us to sort, not you.`
    ),
    sms: (v) => `Hi ${v.firstName}, booking with us means less admin for you - we handle the heavy lifting & tricky access. Confirm: ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}, moving day with us is genuinely simple - our crew does the heavy lifting, you just point us where things go. Stairs, narrow doors, tight parking? Tell us and we plan around it.\n\nYour quote (ref ${v.reference}): *${v.total}*\nConfirm here: ${v.actionLink}\nQuestions: ${v.phone}`,
  },
  5: {
    emailSubject: (v) => `${v.firstName}, your quote's still here whenever you're ready`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `No rush at all — but if you're at the "I think this is the one, I just haven't clicked confirm yet" stage, that's usually a good sign to trust it. Your quote (ref ${v.reference}) for <strong>${v.total}</strong> is locked in and ready whenever you are.`,
      `If price is the only thing holding you back, tell us — we're always happy to talk it through rather than have you go with someone cheaper and riskier.`
    ),
    sms: (v) => `Hi ${v.firstName}, your quote ${v.total} (ref ${v.reference}) is ready when you are. Questions on price? Just call - ${v.phone}`,
    whatsapp: (v) => `Hi ${v.firstName}, no rush - but your quote (ref ${v.reference}, *${v.total}*) is ready whenever you decide. If it's price holding you back, message us, we'd rather talk it through than have you take a risk with someone cheaper.\n\nConfirm here: ${v.actionLink}\nCall/WhatsApp: ${v.phone}`,
  },
  6: {
    emailSubject: (v) => `${v.firstName}, worried about breakages? Here's how we handle that`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `A common worry we hear before people book: "what if something gets damaged?" Fair question — it's your stuff, often things that matter to you. We're fully insured, and every item gets wrapped and padded properly before it goes anywhere.`,
      `If that's been on your mind at all with ref ${v.reference}, happy to talk through exactly how we handle fragile or valuable items.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, if you've been quietly worried about "what if something breaks" - that's exactly what our insurance and proper wrapping/padding is there for. Every item, every move.\n\nQuote ref ${v.reference}: *${v.total}*\nConfirm: ${v.actionLink}\nQuestions: ${v.phone}`,
  },
  7: {
    emailSubject: (v) => `${v.firstName}, we treat every move the same way — personally`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `We move a lot of households, but every single one still gets planned properly — the crew, the van size, the timing, all matched to what you actually need, not a one-size-fits-all slot.`,
      `Your quote (ref ${v.reference}) was put together the same way. Happy to revisit any part of it if your plans have changed.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, every move we do gets planned properly - crew size, van, timing all matched to what you actually need. Your quote (ref ${v.reference}, *${v.total}*) was built the same way.\n\nPlans changed slightly? Just tell us, we can adjust it: ${v.phone}\nOr confirm as-is: ${v.actionLink}`,
  },
  8: {
    emailSubject: (v) => `${v.firstName}, flexible on dates? We'll work around you`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `If your move date isn't fully locked yet, that's fine — quote ref ${v.reference} isn't tied to one specific day. Let us know what you're working with and we'll find a slot that suits.`,
      `The main thing is getting the details right, not rushing you into a date that doesn't work.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, if your date isn't fixed yet, no problem - your quote (ref ${v.reference}, *${v.total}*) isn't tied to one day. Tell us what you're working with and we'll find a slot: ${v.phone}\n\nOr confirm now: ${v.actionLink}`,
  },
  9: {
    emailSubject: (v) => `${v.firstName}, don't just take our word for it`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `We'll keep this one short. If you'd rather hear it from people who aren't us, our Google reviews are public — real customers, real moves: <a href="${v.reviewLink}" style="color:#6b21a8;">${v.reviewLink}</a>.`,
      `No pressure either way — we just think it says more than we could.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, rather hear it from real customers than from us? Our Google reviews are public: ${v.reviewLink}\n\nNo pressure - just wanted you to be able to check for yourself.\nQuote ref ${v.reference} (*${v.total}*) still open: ${v.actionLink}`,
  },
  10: {
    emailSubject: (v) => `${v.firstName}, still comparing quotes? Fair enough`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `If you're weighing us up against another quote, that's sensible — it's your money and your move. Just make sure whoever you compare us to is actually insured and not cutting corners to hit a lower number.`,
      `We're confident in ours (ref ${v.reference}, ${v.total}) on both price and how the day actually goes. Happy to answer anything that'd help you decide.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, comparing quotes? Totally fair. Just double-check the other one is actually insured and not cutting corners on a low price.\n\nWe're confident in ours - ref ${v.reference}, *${v.total}*. Ask us anything: ${v.phone}\nConfirm: ${v.actionLink}`,
  },
  11: {
    emailSubject: (v) => `${v.firstName}, no surprises — your quote is your quote`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Something we take seriously: the price we give you (${v.total}, ref ${v.reference}) is the price, not a starting point that creeps up on the day. If anything genuinely changes — more items, extra access — we'll always tell you before continuing, never after.`,
      `That's a promise, not small print.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, your quote is your quote - *${v.total}* (ref ${v.reference}) - not a number that creeps up on the day. If anything genuinely changes we'll always tell you first.\n\nConfirm here: ${v.actionLink}\nQuestions: ${v.phone}`,
  },
  12: {
    emailSubject: (v) => `${v.firstName}, just want to talk it through? Call us`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Sometimes it's easier to just talk than read another email. If that's you, call or message us on ${v.phone} — no pitch, just happy to answer whatever's on your mind about ref ${v.reference}.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, sometimes it's just easier to talk. If you've got questions about ref ${v.reference} (*${v.total}*), call or message ${v.phone} - no pitch, just a chat.\n\nOr confirm whenever ready: ${v.actionLink}`,
  },
  13: {
    emailSubject: (v) => `${v.firstName}, dates are filling up around your window`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `We don't like pushy countdowns, so we'll just say it plainly: popular dates around your moving window do fill up, and we can only take on so many jobs per day. If you already know this is happening, it's worth locking it in sooner rather than later.`,
      `Ref ${v.reference}, ${v.total} — still ready whenever you are.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, being straight with you - popular dates around your window do fill up, we can only take so many jobs a day. If you know this is happening, worth locking in soon.\n\nRef ${v.reference}, *${v.total}*: ${v.actionLink}`,
  },
  14: {
    emailSubject: (v) => `Last note on this one, ${v.firstName}`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `This'll be our last email about this particular quote (ref ${v.reference}) — not because we're giving up on helping, just so we're not cluttering your inbox. If the timing's ever right, or your plans change and you'd like a fresh quote, we're one message away.`,
      `Either way, we hope the move goes smoothly, whoever you end up going with.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, this'll be our last check-in on this quote (ref ${v.reference}, *${v.total}*) - not giving up on helping, just not wanting to clog your phone!\n\nIf timing's ever right, or you'd like a fresh quote: ${v.actionLink} or ${v.phone}.`,
  },
};

// ── DEPOSIT sequence — they've said yes, just need to lock the date in ─────
export const DEPOSIT_FOLLOWUP_DAYS: Record<number, DayContent> = {
  1: {
    emailSubject: (v) => `Let's get your date locked in, ${v.firstName}`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Thanks again for confirming — we're looking forward to it. The last step to actually lock in your date and crew is the deposit on invoice ${v.reference} (${v.total}), which comes straight off your final balance.`,
      `Takes about a minute online, card or bank transfer, whichever's easier for you.`
    ),
    sms: (v) => `Hi ${v.firstName}, thanks for confirming! Pay your deposit (${v.total}, ${v.reference}) to lock in your date: ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}! Thanks for confirming your move with us. Last step to lock in your date and crew is the deposit - *${v.total}* (invoice ${v.reference}), which comes off your final balance.\n\nPay here (card or bank): ${v.actionLink}\nQuestions: ${v.phone}`,
  },
  2: {
    emailSubject: (v) => `${v.firstName}, paying online is safer than it feels`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `If you're the type who double-checks before paying anything online (fair enough) — invoice ${v.reference} is a secure card payment, or you're welcome to use bank transfer instead if you'd rather see the details first.`,
      `Either way, your deposit of ${v.total} comes straight off the total, it's not an extra cost.`
    ),
    sms: (v) => `Ample Removals: deposit ${v.total} (inv ${v.reference}) - card or bank transfer, your choice. Comes off your total. ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}, no rush but a quick reassurance - paying your deposit (*${v.total}*, invoice ${v.reference}) is secure, and it comes straight off your total, not on top.\n\nPrefer bank transfer? Details are on the invoice. Pay online here: ${v.actionLink}`,
  },
  3: {
    emailSubject: (v) => `${v.firstName}, here's what the deposit actually locks in`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Just to be clear on what happens once ${v.reference} is paid: your date, your crew and your van are reserved specifically for you. No juggling, no "we'll confirm closer to the time."`,
      `Deposit is ${v.total} — happy to help if anything's stopping you from paying it today.`
    ),
    sms: (v) => `Hi ${v.firstName}, once your deposit (${v.total}, ${v.reference}) is in, your date & crew are reserved just for you. Pay: ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}, once your deposit is in (*${v.total}*, invoice ${v.reference}) your date, crew and van are reserved specifically for you - no last-minute juggling.\n\nPay here: ${v.actionLink}\nAnything stopping you? Just message ${v.phone}.`,
  },
  4: {
    emailSubject: (v) => `${v.firstName}, prefer bank transfer? Details are on your invoice`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Some people would rather not put a card in online, which is completely fine — the bank transfer details for invoice ${v.reference} (${v.total}) are right there on the invoice we sent, use your invoice number as the reference.`,
      `Whichever way you pay, it locks your date in the same.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, if you'd rather not pay by card online, that's fine - bank transfer details for invoice ${v.reference} (*${v.total}*) are on the invoice we sent, just use the invoice number as your reference.\n\nOr pay online: ${v.actionLink}`,
  },
  5: {
    emailSubject: (v) => `${v.firstName}, quick nudge on your deposit`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Most people pay their deposit within a day or two of the invoice landing, so if it's slipped down your to-do list, this is your nudge. Invoice ${v.reference}, ${v.total} — a minute to pay, and your date's properly locked in.`,
      `Anything unclear, just ask.`
    ),
    sms: (v) => `Hi ${v.firstName}, quick nudge - deposit ${v.total} (${v.reference}) locks in your date. Takes a minute: ${v.actionLink}`,
    whatsapp: (v) => `Hi ${v.firstName}, quick nudge - most people pay their deposit within a day or two, so if invoice ${v.reference} (*${v.total}*) slipped down your list, here's the link: ${v.actionLink}\n\nAnything unclear, just ask - ${v.phone}`,
  },
  6: {
    emailSubject: (v) => `${v.firstName}, your preferred date is still popular`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `We're not going to pretend your slot's about to vanish overnight, but weekends and month-ends do fill up fastest, and yours is only fully reserved once the deposit's in. If your date matters to you, it's worth not leaving it too long.`,
      `Invoice ${v.reference}, ${v.total}.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, being honest - weekends and month-end dates fill up fastest, and yours is only fully reserved once the deposit's in. If your date matters, worth sorting soon.\n\nInvoice ${v.reference}, *${v.total}*: ${v.actionLink}`,
  },
  7: {
    emailSubject: (v) => `${v.firstName}, here's what happens right after you pay`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `In case it helps to know what's next: the moment your deposit clears, we mark your job confirmed, your crew gets scheduled, and you'll get a proper confirmation with everything set out. Nothing else needed from you at that point.`,
      `Invoice ${v.reference}, ${v.total} — ready whenever you are.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, once your deposit clears we confirm your job, schedule your crew, and send you a proper confirmation - nothing else needed from you.\n\nInvoice ${v.reference}, *${v.total}*: ${v.actionLink}`,
  },
  8: {
    emailSubject: (v) => `${v.firstName}, why we ask for a deposit at all`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `We've heard from a few customers who'd previously left a booking "unconfirmed" with another company, only to find their date had quietly gone to someone else when they finally tried to pay. The deposit is what stops that happening to you.`,
      `Invoice ${v.reference}, ${v.total} — your date, held properly, not provisionally.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, we've heard from customers whose date quietly went to someone else with another company because they never actually locked it in. The deposit is what stops that.\n\nInvoice ${v.reference}, *${v.total}*: ${v.actionLink}`,
  },
  9: {
    emailSubject: (v) => `${v.firstName}, here's what other customers say`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `If it helps your confidence before paying, our Google reviews are public and genuine: <a href="${v.reviewLink}" style="color:#6b21a8;">${v.reviewLink}</a>.`,
      `We'd rather you paid knowing exactly who you're dealing with.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, before you pay, feel free to check our genuine Google reviews: ${v.reviewLink}\n\nWe'd rather you felt sure about who you're dealing with.\nInvoice ${v.reference} (*${v.total}*): ${v.actionLink}`,
  },
  10: {
    emailSubject: (v) => `${v.firstName}, any concerns about the deposit?`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `If there's something specific holding you back from paying — the amount, the timing, anything — tell us. We'd genuinely rather sort it out with you than just send another reminder.`,
      `Invoice ${v.reference}, ${v.total}.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, if something specific is holding you back from paying the deposit, tell us - amount, timing, anything. We'd rather sort it than just send another reminder.\n\n${v.phone}\nInvoice ${v.reference} (*${v.total}*): ${v.actionLink}`,
  },
  11: {
    emailSubject: (v) => `${v.firstName}, your booking is properly protected`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Worth saying plainly: we're a fully insured company, and your deposit isn't money at risk — it's what secures a professional, accountable team for your move, not a gamble.`,
      `Invoice ${v.reference}, ${v.total} — ready when you are.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, worth saying plainly - we're fully insured, and your deposit isn't money at risk, it's what secures a proper, accountable team for your move.\n\nInvoice ${v.reference} (*${v.total}*): ${v.actionLink}`,
  },
  12: {
    emailSubject: (v) => `${v.firstName}, one tap and you're done`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `Honestly, this is the easy part — one tap on the link below, card or bank transfer, and your booking is fully locked in. Everything harder (the actual move) is on us from here.`,
      `Invoice ${v.reference}, ${v.total}.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, this is the easy part - one tap and your booking's fully locked in. The hard part (the actual move) is on us from here.\n\nInvoice ${v.reference} (*${v.total}*): ${v.actionLink}`,
  },
  13: {
    emailSubject: (v) => `${v.firstName}, we'd hate for you to lose your date`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `We're not chasing you for the sake of it — we just genuinely wouldn't want you to lose the date you wanted over an unpaid invoice sitting in an inbox. If you're still planning to go ahead, this is the moment to sort it.`,
      `Invoice ${v.reference}, ${v.total}.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, not chasing for the sake of it - we'd just hate for you to lose your date over an invoice sitting unread. If you're still planning to go ahead, now's the moment.\n\nInvoice ${v.reference} (*${v.total}*): ${v.actionLink}`,
  },
  14: {
    emailSubject: (v) => `Last note on your deposit, ${v.firstName}`,
    emailBody: (v) => p(
      `Hi ${v.firstName},`,
      `This is our last reminder about invoice ${v.reference} — we don't want to keep filling your inbox over it. If your plans have changed, no hard feelings at all, and if you'd still like to go ahead, we're genuinely just a message away.`,
      `Either way, thank you for considering us.`
    ),
    whatsapp: (v) => `Hi ${v.firstName}, last note from us on invoice ${v.reference} (*${v.total}*) - don't want to keep filling your phone. Plans changed? No hard feelings. Still want to go ahead? We're one message away: ${v.actionLink} or ${v.phone}`,
  },
};
