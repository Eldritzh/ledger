# Patch Notes

*What's new on the stream, in Discord and on this site. Newest first.*

## Patch 0.15: One Voice

*26 November 2026.* Every game and system now speaks through the Herald, so a busy chat stays readable and only the platforms we're live on hear it; your gifts on Ko-fi and the shop count on every account you've linked, Discord included; and Ropes are cheaper to forge.

### Chat
- **Every system speaks through the Herald.** The Pact Wheel, the Hourglass, Nemesis, Tsathoggua, the Rites, Wagers, the Summonings, Clipomania, the Goblins, duels, the Beings, the seasons and the rest now share the Herald's chat budget, like fishing and the Delve already did. Answers to your commands still come straight away; when chat is busy, game results fold into one line and progress moves to the on-stream popups.
- **Only where we're live.** Announcements and other lines for everyone now go only to the platforms Dave is live on, so Kick or YouTube chat no longer gets lines from a stream that isn't there. Answers to your commands always come back to the platform you typed on.
- **Sponsored streams.** On a stream made with a sponsor, other partners' lines and our own ad-like reminders (shop, codes, links) wait until it's over. Everything else, your commands, games and thanks, works as usual, and a charity we're raising for keeps going.
- Outside sponsored streams, partner lines, charity and the timed messages work as before.

**Developers' notes:** Until now only a dozen systems went through the Herald; the rest posted straight to chat, so they could still flood it in a busy moment. With every line in one place, the Herald can now also decide which platforms get a line and keep a sponsored stream quiet, without touching each game.

### Ko-fi and the shop
- **One donor, every account.** If you've linked your accounts with `!link`, you can `!claim` a Ko-fi or Fourthwall offering from any of them, not just the one whose name matches.
- Write `kick:yourname`, `yt:yourname` or `discord:yourname` in your Ko-fi note to have it paid on that account straight away, if the Codex knows it. For Discord that's the account you tied with `/forge link`.
- Gifts on different linked accounts now count together towards your next Pact and Eldritch Pact, and the bonus for a first membership is once per person.
- `!link status` shows your Discord (once you've used `/forge link`) and when your accounts carry Ko-fi or Fourthwall offerings.

**Developers' notes:** Ko-fi and Fourthwall kept their own list of who is who, separate from the Codex's `!link`, and the forge kept a third one for Discord. A regular who tipped once from Twitch and once from Kick filled two separate Pact counters. Now all three live in the same record.

### The Delve
- **Ropes are cheaper:** forging one takes 2 common materials instead of 4.

### On stream
- **Less clutter on screen.** The trackers, the bans, Tsathoggua, his blessings, the Merchant, the hype portal and the Workings now share one small box in the corner. It shows whatever has something going on, one at a time, and jumps to the right one when you use its command (`!stabby`, `!ban`, `!feed`, `!buy`, `!wanted` …). When nothing's happening it gets out of the way.
- **New on stream:** the story's next sealed page and how close we are (`!story`), the Miskatonic's Wanted poster with its bounty (`!wanted`), and a charity bar while we raise for a cause (`!charity`).

### Counters
- `!execution` counts one of Dave's executions, like `!stabby` counts his stabbings, and `!executions` shows how many so far, this stream and all time.

### Check-ins
- The old daily check-in commands (`!mustcheckin`, `!mustdaily`, `!checkins`) are retired. You still check in by chatting on stream, and your check-in count carries on as it was.

### The site
- **A Charity page.** When the stream raises money for a cause, its own page shows how far we are, how many have given, and a button straight to the cause. Causes we raised for before stay there with what the congregation gave (totals only, never names). Causes are no longer listed with the paid partners.
- On the members' page, links can now open straight on the Lineages or Occupations tab, where members pick theirs.
- The guide, the About page, the menu and the site's own words now update by themselves when we change them, like the Commands page and these patch notes, and a change shows up within about ten minutes.

### Remembrance
- Gifts, gift bombs, bits, subs and tips are counted for the Shard of the Month and your devotion exactly the way every other system counts them, on every platform.

## Patch 0.14: Tribute

*26 November 2026.* Every gift to the stream now goes through one door: power-ups and KICKs finally count, every gift gets one thank-you instead of two, and money everywhere joins the fight.

### Support
- **Power-ups count.** Gigantify an Emote, Message Effects, On-screen Celebrations and the channel's own power-ups now pay like a cheer of the same bits: Madness, Pacts, Rift Shards and fishing bait.
- **One thank-you per gift.** A cheer, sub, gift, Super Chat, member or Kick sub now gets a single line in chat that says thank you and what you earned, instead of a thank-you followed by a payout line. Anonymous cheers and gifts are thanked too.
- **Ko-fi and the shop pay in full.** Ko-fi subscriptions, shop orders and commissions, and Fourthwall donations, gifts, orders and subscriptions now earn their Madness, Pacts and shards, like a Ko-fi tip always did. Claim them with `!claim` as before.
- **Every gift joins the fight.** Super Chats, KICKs, Ko-fi and Fourthwall now drain Dave's Sanity, hurt the Stars, add glory to your cult and fill the Miskatonic's Wanted, the way bits and subs do. Cheers, subs and gifts reach all of these properly too.

**Developers' notes:** Before this, cheers and subs reached the alerts and payouts but quietly never reached the Sanity meter, the Stars or your cult, and Ko-fi subscriptions and every Fourthwall event paid nothing at all. Now every gift passes one place on its way in, so it can't miss a system again, and a gift that arrives twice only counts once.

### Hype trains
- Contributors to a Golden Kappa train are now remembered properly, so the Wards and shards at its end reach everyone who helped.

## Patch 0.13: The Miskatonic's Wanted

*25 November 2026.* Miskatonic University puts up a WANTED board, and the whole congregation hunts every horror on it together, from the Shallows down to Azathoth. Plus a fairer Litany.

### The Miskatonic's Wanted
- One WANTED poster is up at a time. The first is the Ghoul; Azathoth is the last of 244. `!wanted` shows the one up now, `!wanted next` the three after it.
- Every poster has a Threat, from I (the Shallows) through the Deep, the Delve's branches, the legendary horrors, the Lords of the vaults and the raid bosses, to VII (the Old Ones).
- Put Madness on the bounty with `!wanted pay <Madness>`, up to 5,000 a day each, so it takes a team. Bits and subs add to it too, in your name.
- When the bounty is paid, chat is told straight away. Dave calls the hunt when the moment is right, never in the middle of something else: be in chat for it.
- While a paid poster waits for its hunt, anything you pay goes on the next one.
- In the hunt, every chat message is a blow from your character, one every 5 seconds however much you type: no need to spam. Your talents count, and so do your lineage and occupation against the kind of horror on the poster. Bits and subs hit harder.
- Bring it in and everyone who fought gets XP, Madness, glory for their cult, the horror in their Banished journal and its spoils for the forge (a Brine Scale off a Deep One, say). The fiercest gets a Ward and the rare spoil, and at the Lords their own trophy.
- Paid in but missed the hunt? Half the XP is still yours.
- If it gets away, the bounty stands and the hunt goes on another time.
- New achievements: Brought In, Deputy of the Library, Dead or Dreaming and Terror of the Unnameable (1, 5, 25 and 100 horrors, the last with the title *the Bounty Hunter*), and four for Madness put on the board (*the Benefactor*).
- The board is on the Winners & Special Events page here, with the last horrors brought in and who fought hardest.

**Developers' notes:** The prices follow the bigger payouts from 15 November, so a bounty takes a handful of regulars at their daily limit, and a hunter's pay sits next to an Elite's. We'll tune the bounties and the horrors' might after the first hunts.

### The Litany and the Workings
- New rite: put some Madness on the Miskatonic's Wanted.
- "Win a duel" is gone. "Fight a duel" comes up a little more often instead.
- New Working: Posting the Bill, enough different people paying into the Wanted.

**Developers' notes:** On a quiet night there isn't always someone to duel, and a rite you can't do is no fun. A rite that only asks you to fight can always be done.

## Patch 0.12: The Hollow Hall

*25 November 2026.* The Discord becomes part of the game: talking there levels you up, levels pay out, and the server gets its own ranks and rites. Plus standing at the Onyx Fair, ten new talents, money that wakes the rift and thirty hidden deeds.

### The Discord
- **Talking in the Discord levels you up.** Messages there count toward your investigator level, the same level the stream, the Delve and fishing feed. One message a minute counts (spam and repeats don't), as long as your Discord is linked (`/forge link`). `/level` shows how many counted today.
- **Discord ranks.** The more you talk, the higher your rank: *Murmur in the Dark*, *Whisperer at the Threshold*, *Voice from the Deep*, *Keeper of Echoes*, *Herald of the Hollow Hall*, *Chorister of the Abyss*, *Tongue of the Crawling Chaos* and, for the very few, *The Voice That Does Not Sleep*. Your rank can show as a role on the server, and a new rank is announced in #level-ups.
- **Discord rites.** `/rites` gives you two daily and one weekly challenge that live only in the Discord: talk, cast your line, go down into the Delve, visit the fair. Each pays Madness and XP.
- **Level-ups in Discord.** The big ones are announced with what you found, with a ping if your account is linked.
- **New patrons and causes are announced** in #announcements when they sign the Ledger.
- **More commands:** `/litany` (and `/litany swap:`), `/workings`, `/codex`, `/balance`, `/bounties`, `/season`, `/story`, `/nemesis`, `/deaths`, `/relics` (everything you carry), `/rank` (every rank you hold), `/sunwait` and `/cults`.

### Levels
- **Levels pay out.** Every level-up brings something, wherever the XP came from: Madness every level, a **Bundle of Wrack** at levels 5, 15, 25 and on, a **Sunken Coffer** at 10, 20, 30 and on, Rift Shards, Pacts at 25 and 40, an Eldritch Pact at 50 and a **Reliquary of Leng** at the top. Open them with `!coffer open`. Born again? The levels pay again in your new life.
- **New investigators level faster again** through the first levels, so the first talent point comes in about three streams.
- **More ways to earn XP:** Onyx Tickets you earn, and signing in on eldritzh.com once a day.
- **Ten new talents:** *Second Reading*, *Correspondence*, *Appraiser*, *Gatewatcher*, *Eavesdropper*, *Bought Blood*, *Lure-Wise*, *Friend of the Fair*, *Reader of Lots*, and a capstone for Esoterica, *Walker Between*.

### The Onyx Fair
- **Standing at the fair.** Every Onyx Ticket you earn or spend, every fortune and every visit to the site while the fair is in town raises your standing, from *Stranger at the Gate* to *Trusted of the Merchant from Leng*. The higher steps bring perks: tickets from the Veiled Priest more often, an extra ticket for turning up, wares a ticket cheaper and one more trade a day. `!fair` shows where you stand.
- **The Merchant's rare-goods shelf.** Next to his stall, a few rare goods that change every six hours: the **Pnakotic Fragment** and **Folio** (read on the spot for XP), the **Inquanok Balm** (heals every wound in the Delve, `!delve use balm`), Turquoise Keys, Ginkgo Leaves, curios, Tsathoggua's Favour, an *Odd Lot* and a *Rare Lot*, a *Cult Lure*, a lure *Fragment* and, while Yule runs, its own goods. One of each per person a turn. `!fair shelf`.
- **The Shantak Quill.** A flight feather from Leng, good for three uses: in the Delve it is used on the next boss for much better odds, and while a hype train has dragged an Old One down, `!delve use quill` strikes it hard. The screech costs lantern oil.
- **Pay in Madness:** some wares can be bought with Madness instead of tickets, `!fair trade <#> madness`.

### Support
- **Wake a rift effect with bits, a tip, a Super Chat or KICKs.** Name it in your message (`Cheer500 !fx eye`, `fx eye` or `#eye`) and it comes through once the amount reaches its price, or cheer an effect's own number (666 bits wakes The Watching Eye). If the rift is busy, it waits its turn.
- **KICKs count** like a tip: Madness, Pacts, Rift Shards and a strike on an Elite.
- **A lure for every sub.** Subs, resubs and whoever receives a gifted sub get a fishing lure.
- **Your clips pay.** Every clip posted in the clips channel pays its maker once it has been out for two days: 500 Madness and 50 XP, plus 5 Madness and 1 XP for every view (up to 500 views). Clipomania's monthly prizes stay as they are.

### The Litany
- **Your Litany on stream.** `!litany` puts your three rites on the stream as a card for about ten seconds, instead of a long line in chat. Cards take turns. `!litany text` still answers in chat.

### The Codex
- **Unspeakable Deeds.** Thirty hidden feats now lurk in the Codex, things that happen once in a long while or take a very long time. Nobody sees one until someone does it. No hints. Well, one: be quick, be unlucky, be stubborn.
- New achievements for talking in the Discord (up to *The Voice of the Server*), coffers found by levelling, days on eldritzh.com (*Reader*, *Keeper* and *Archivist of the Ledger*), Onyx Tickets, trading with the Merchant, rare goods, rift effects woken with money, Discord rites and paid clips.

### Chat
- **Shorter replies.** Long answers like `!level` now end with a link to your page on the Ledger, and progress that shows as a popup on stream is also posted in the Discord.
- Asking the same thing twice within half a minute gets one answer instead of two.
- Long answers now reach **YouTube** chat, sent in parts instead of not at all.

### The site
- **Skills on your Ledger card:** Night Fishing, the Delve, your Discord rank and your standing at the fair, each in its own colour.
- **Pledge cards on the Covenant page:** each talent shows its ranks, how many have pledged it, whether it's on the ballot and what it opens, plus a *Most pledged* board.
- **Your standing on the Fair page:** every step with its perks, where you stand and the five the Merchant trusts most.
- *The Ledger* glows a soft green in the shop's menu, so it's easy to find.

### Fixes
- Feeding fish to Tsathoggua just as he falls asleep or fills up no longer loses them: what he can't eat comes back as Madness.
- A hype train raises one Old One. Once it falls, the rest of that train (or a restart of the bot mid-train) can't raise a second.
- Someone chatting mid-spin could take over a Pact Wheel spin (`!pact`). Fixed.

## Patch 0.11: The Gate

*22 November 2026.* The rift can now open a Gate, sealed loot washes up as coffers, and the forge learns to make bait. Plus the fixes from the 21 November stream.

### Beings
- **The Gate.** Very rarely (about one Being in fifty, never twice in a stream) the rift doesn't tear, it *opens*. Yog-Sothoth's Gate lets 3 to 5 Beings through, one after another, and the last one is always an Elite. Banish them all and the Gate is sealed: everyone who helped gets 500 Madness and 2 Ichor. Let one escape and it collapses, and its backlash strikes one to three people who were chatting. A Ward takes the hit for you. Thanks to Ducky for the idea.
- **Your support fights Elites.** Bits, subs, gift subs, YouTube members and Super Chats, Kick subs and gifts, and donations strike an Elite or Rare Elite on screen, harder the bigger they are. It counts as your blows, so you're paid with the other fighters when it falls.
- New achievements for sealing Gates, and a hidden one for being caught in the backlash.

### Coffers
- Three new kinds of sealed loot: a **Bundle of Wrack**, a **Sunken Coffer** and the rare **Reliquary of Leng**, from bait and Delve tools up to shards, Pacts and, very rarely, an Eldritch Pact. Every fishing derby hands them to its top three. `!coffer` shows what you hold, `!coffer open` (or `/coffer open`) cracks one.

### Night Fishing
- **Make your own bait.** The forge turns what you bring up from the Delve into bait: Pickled Eels, Deep One Scale Spinners, Shoggoth Jelly, Mi-Go Brain Chum and Star-Spawn Roe. `!fish craft` shows what you can make, `!fish craft <bait>` makes it.
- **The Flotsam of the Alert lingers** for two and a half minutes (was one).
- **`!water` tells you where to level**, and what your next angler rank wants when your skill is held back.
- `!fish feed` no longer throws your fish away while Tsathoggua sleeps.

### Duels
- Duel boons have names that fit: a drain is something like *Lifedrinker*, a curse *Maddening Hex*, a shield *Armor of Shadows*.

### Fixes
- Pouring Ichor into a ritual circle counts toward the Workings and the Litany's pour rite.
- `!fish` and the Delve could sometimes think you had 0 Madness. They check again now.
- When someone chatted at the exact moment you bought something with `!buy`, the purchase could land on them. It can't any more.
- Partner logos sit properly in their seal again.

## Patch 0.10.1: Every Command

*21 November 2026.* The Commands page lists everything, and the site keeps itself up to date.

### The site
- **Every command on the Commands page,** including the small ones (`!watchtime`, `!deaths`, `!followage`, `!clip`, `!8ball` and friends, under *Odds and Ends*) and the other names a command answers to: `!points` for `!madness`, `!lvl` for `!level`, `!dailies` for `!litany`, `!onyx` for `!fair`, `!accept` and `!decline` in duels, and more.
- **The site keeps up by itself.** New commands and these patch notes reach it minutes after they're made.

## Patch 0.10: The Merchant's Stall

*20 November 2026.*

### New
- **The Merchant from Leng comes to the Onyx Fair.** While the fair is in town he keeps a stall next to the booth, with a new rug every day at midnight: bait for Night Fishing, torches, rope and salve for the Delve, Ichor, candles and Wards, Sealed Rift Shards, a Pact, and on lucky days a Silver Key or even an **Eldritch Pact**. He takes Onyx Tickets. `!fair wares` shows what he has today, `!fair trade <#>` buys, and it works in Discord (`/fair wares`, `/fair trade`) and on the Fair page too. His stock is shared by everyone, so the good things go fast, and he trades with each of us three times a day.
- **The Benison.** Subs, YouTube members and members of eldritzh.com now get Pacts and sealed Rift Shards every week (and the higher tiers an Eldritch Pact a month), paid the first stream day of the week you turn up, or by the forge for eldritzh.com members even on weeks you miss. Sub *and* member? You get the bigger package plus a shard. `!benison` (or `/benison` in Discord) shows yours.
- **More Pacts and shards for turning up.** A shard for a whole Litany and a Pact for your third whole Litany in a week, a shard for everyone who helps finish a Working, shards for raiders, shards at watch streaks 5 and 15, and the Order pays its weekly Pact from rank 9 (was 13) with shards from rank 5.
- **The Silver Key does more.** `!door` opens a door that wasn't there (coins, Wards, shards, keys, sometimes a Pact, rarely worse), `!key return` takes back half a gamble or duel you just lost (once a stream), `!key give @someone` passes one on, and in the Delve a key gets you past a dead end when the rope is gone.
- **Two new keys.** The **Onyx Key** opens the Onyx Fair's booth for you before the fair, or buys a second reading from the Veiled Priest (`!fair key`). The **Turquoise Key** opens the dream-sea of Serannian and a free berth on the galleys.
- **Celephaïs.** On every new moon the galleys of Celephaïs dock while we're live: `!board` with some Madness and come back from Serannian with more, and maybe a key. Now and then King Kuranes lays out a feast for everyone (`!feast`). The sealed Sky-Sea of Serannian has its own fish and the Crown of Kuranes.
- **New boss bars on stream.** The Stars boss gets a long gold bar that drains with a green chip after each blow, and its shadow rises behind the camera. Elite Beings get a portrait frame with their level.
- **The Onyx Lure.** Carved in Inquanok and only sold at the Merchant's stall: it fishes the abyss like Mi-Go Brain Chum, lasts 20 casts instead of 6, and its shimmer draws rarer fish in every water. `!bait onyx` once you have one.

### Changed
- **Fish sell for a little more.** The Merchant from Leng now pays enough that a creel sold earns a bit more than the casts cost, instead of a small loss.
- **On phones**, the event bar at the top of eldritzh.com no longer sits on top of the shop's menu, cart or pop-ups.

## Patch 0.9: The Onyx Fair

*19 November 2026.*

### New
- **The Onyx Fair of Inquanok.** For the first week of every month, the onyx city at the foot of Kadath opens its fair. Earn Onyx Tickets by turning up, being first, staying a while, supporting the stream, raids, a whole Litany and helping a Working. Spend them at the booth on flares, lanterns, the Veiled Priest calling your name or a night-gaunt over the stream: `!fair buy <prize>`, or on the new Fair page here. One prize plays at a time and your tickets only come off when it plays. And let the Veiled Priest read your fortune: two questions, and your answers choose a boon for a while (`!fortune`). Tickets keep from one fair to the next.
- **The Onyx Fair in Discord.** `/fair` shows your tickets, `/fair booth` the prizes, `/fair buy` sets one off on stream and `/fair fortune` asks the Veiled Priest. Discord hears when the fair opens, on its last day and when it leaves, and the whole server hears about every ultra-rare and every new angler rank. `/fish train` is there too.
- **Members of eldritzh.com at the Fair.** One more Onyx Ticket each time you turn up, the booth opens a day early for you, and a prize of your own: *A Lantern in Your Name*, a great lantern that rises over the stream with your name on it. Everything else at the fair stays open to everyone. Link your Discord to the forge (`/forge link`) so the stream knows you're a member.
- **Link your account any time.** `!forge CODE` in Twitch chat now works whenever you like, not only while the stream runs. Kick and YouTube still work while Eldritzh is around. Already linked in Discord? The members' page code also works there: `/forge site CODE`.
- **A bar across the top of eldritzh.com** shows what's on: the season or omen, the Onyx Fair (a violet onyx mark and little flares), Happy Hour (gold coins) and the Stars Are Right (a star) while they run, plus banners when a stream is for a charity or brought by a sponsor.
- **Winners & Special Events**, a new page: what runs now and what's coming, how each event works, and who won lately: giveaways, fishing derbies, Clipomania, the Remembrance, the crowns, the first finders of the ultra-rares and the Old Ones that fell.
- **The hype-train countdown.** The Workings board on stream counts down to when a hype train can start again, and blows a horn when the gate opens.
- **Angler ranks.** Your Fishing skill now waits at each rank until you earn the next: Wharf Rat (up to 75), Harbour Hand (150: land Wharf Eels or Grave Mudskippers on two different days), Deep Caster (225: buy the Almanac with `!fish train`, then fish on three days) and Dagon's Chosen (300: fish up Captain Obed Marsh's Logbook). Nothing you already reached changes, and you keep catching while you wait. `!fishing` shows your rank and the next step.
- **Ultra-rares.** A handful of things so rare a regular meets one once in a hundred streams or more, in the waters and in the Delve, each with its own achievement and a fat purse. The One Ring is down there somewhere, in the deepest water or the deepest dark. Each is yours for good, and the first in the realm to find one is written on the Night Fishing page.
- **Five new talents** in the investigator's trees: Devotions (more from your Litany), Old Salt (the Logbook comes sooner), Light Sleeper (dream faster), Onyx Patron (a ticket more when you turn up at the fair) and Uncanny Fortune (ultra-rares find you more often). Pick them on the Investigator page like the rest.
- **The Litany.** Every stream you get three small rites of your own the first time you turn up: speak in chat, banish a Being, cast a line, look at your talents, feed Tsathoggua and dozens more, each with its own amount. Each rite pays XP and Madness, and speaking the whole Litany pays a bonus with a chance at a Pact. `!litany` shows yours; `!litany swap` trades one rite once a stream. Only rites for things that are switched on are ever drawn.
- **The Workings.** A board of goals for the whole congregation, drawn when the stream starts: different voices in chat, Beings banished, fish landed, Tsathoggua fed and more. Everyone who helps a Working to its end is paid, and every finished Working feeds Eldritzh's Awakening. Some must be done in the first minutes, or they fail. The goals learn from what we actually do on stream. `!workings`, and a small board on stream.
- **Dreaming.** Watching quietly is worth something now: after a while without a word you start to dream, and Dreaming XP builds up (twice as fast after `!lurk`). When you speak again you wake with it, and your chat XP counts double (the rest of your XP a little more) until it's spent. `!dreaming` shows yours.
- **Five new Covenant talents** in The Long Night: one more rite in everyone's Litany, rites that pay more, one more Working on the board, Workings that pay more, and faster dreams.
- New achievements for rites spoken, whole Litanies, Workings helped and time spent dreaming.
- **Trackers.** Goals for the game on stream: *Headshots 3/10*, *Kills 7/15*, and a **Gunathon** that walks Dave through a run of weapons one kill at a time. Each game has its own goals, they light up on stream as they count, and a fulfilled goal feeds the Pact pool. See where they stand with `!tracker`.
- **Shape them.** `!tracker up` makes a goal harder and `!tracker down` makes it easier, for Madness. `!tracker swap` trades a goal for a surprise from the pool, `!tracker pick` chooses one, and `!tracker reroll` gives the Gunathon a different weapon, for Pacts. A goal more than half done stays put.
- **`!stabby`** is back as a tracker: anyone can count one, it shows on stream for a moment, and `!stabbings` keeps the score.
- **New achievements** for meddling with the tally: raising and easing goals, swapping them, having the goals you shaped fulfilled, and a stream's Taskmaster of the Night. Two of them are hidden.

## Patch 0.8: The Covenant Tree

*18 November 2026.*

### New
- **The Covenant is a talent tree.** Four branches (The Hunt, The Deep, Leng's Market and The Long Night) and nineteen new talents for everyone: fishing, the Delve, descents, duels, Wards, goblins, gambles, Pickman, Rift Shards, riddles, Pages, the Order and the Dreamlands. Each branch ends in a capstone. A vote only offers what the tree has opened, so what the congregation takes first decides what comes next. Everything already taken stays.
- **Pledges.** Pledge to the Covenant talent you want most with `!covenant pledge <name>`, or on the Covenant page. The most-pledged ones are always on the next vote.
- **The Covenant page** now shows the tree as it stands, what's on the ballot and how many have pledged. Members can pledge and vote right on the page, with the same key as the talent tree (`/shard key` in Discord).
- **Eldritch rites.** The big Rift effects can be woken together: `!fx <name> rite` opens a circle, and two of you (for an effect you see and hear) or three (for one that also reaches into the game) pay one Pact each. Join an open circle with `!fx <name>`. If the circle doesn't fill in time, everyone gets their Pact back. An Eldritch Pact still does it alone.
- **New Eldritch effects:** The Long Night, The Shoggoth Engulfs, Undertow and the Bell of the Drowned City, each seen and heard.
- **Delve Dares.** Three challenges each week (one easy, one harder, one hard), each paid once per delver per week. `!delve dares`, or `/delve dares` in Discord.
- **The week's tide.** Every week one water gets a tide with its own small boon there: rarer fish, curios, more Aberrant catches, faster skill or XP, and now and then a sealed Rift Shard, a Pact or a page. `!fish tide` or `/fish tide`; Discord hears when it turns.
- **Nine new fishing derbies** and two event fish, with new kinds of prizes.
- New achievements for the Dares, the tides and the derbies.

### Changed
- **Sign in to plan.** Everyone can still read the talent trees and the Covenant, but planning a build now needs you to sign in with your key (and a linked account). Saving, pledging and voting from the site are for members.
- **A quieter chat.** The bot now keeps an eye on how much it talks. Answers to your commands, thanks for support and the first three arrivals still come at once. When chat is busy, game results (fishing, the Delve, descents, `!tempt`) and later arrivals are gathered into one line instead of one each. On Twitch, answers to your commands appear as replies to your own message.
- **Level-ups move to the stream.** Level-ups, Order ranks, achievements, Rift Shards and forge deliveries now pop up on stream instead of in chat. Nothing is lost: `!level`, `!codex` and this site still show it all.
- `!herald` shows how chatty the bot is right now.
- **Eldritch effects are the big ones now:** only effects you both see and hear, or that hit all three (sight, sound and the game). Drowned Lens, The Eclipse, Shoggoth Smear and the Bell are Pact effects now, and the Eldritch hands (Turn Back, Lantern Out and the rest) come with their own sight and sound.
- **The Merchant from Leng pays half again as much for fish.**
- **Fishing from Discord** works like on stream, but your Fishing skill and XP grow at half the speed there, and legendary fish bite even less often from the shore.
- **The Delve:** a run without a single push gives no XP.
- **Mourning lasts 40 seconds**, and **`!pour`** adds far more Madness per Ichor to a Being's reward.
- **Achievements earned in Discord** still count at once; their pop-up on stream now waits until Eldritzh has been live for ten minutes.
- **Patrons:** partners are listed first, then affiliates, then ads, on this site and in Discord's #patrons, where each one now shows its dates.
- **First in chat starts with the stream.** Going live opens first, second and third to everyone again, so checking in while Eldritzh is offline no longer takes a place. A restart within 20 minutes is still the same stream.
- **Pop-ups on stream stay a little longer.**

### Fixed
- **Giveaways:** sending the same entry twice on Twitch was ignored by the tag, `!ticket` and the brand command. It counts now, and the tag with an amount works in every kind of giveaway.
- **The Covenant page** could say "The Ledger could not be read" while the new tree was on its way. It shows the list until then.

## Patch 0.7: A Richer Dark

*15 November 2026.*

### Changed
- **Banishing pays far more.** Every Being now gives about ten times the Madness it used to, and twice the Ichor.
- **Elites pay properly.** Everyone who fights an Elite now gets 1,000 to 3,500 Madness (it was 100 to 250). Rare Elites pay double that, and the fiercest fighter against a Rare Elite also earns a Pact.
- **Chatting pays more.** Every chat message now gives 15 Madness, up from 5.
- **Tsathoggua isn't so hungry.** His appetite had grown into the hundreds of thousands. He's back to 5,000 to fill. Fill him two streams in a row and he still wakes up hungrier, but now only three times as hungry (it was five), and after that he grows 5% per fill (it was 10%). Careful with `!feed all`: it really does feed him everything you have.
- **Night Fishing costs less while you learn.** The price of a cast now follows your Fishing skill: a new angler pays only a tenth of it, and the price climbs as your skill grows, up to the full price at the top.

### Fixed
- A giveaway of Eldritzh's own no longer shows a sponsor's *Ad* tag left over from an earlier sponsored giveaway.
- Mods could not give out Madness with `!bestow`. It works again.

## Patch 0.6: Boons and Banes

*12 November 2026.*

### New
- **Boons and banes.** Your occupation and your lineage now matter in a fight. Each one is good at some things and bad at others, the way that trade or that blood would be: a Deep One Hybrid fishes the sea well and Deep Ones go easy on kin, but Flame and Frost dry the gills; a Ghoul knows other ghouls and the restless dead, but fire and holy relics hurt; an Orc hits hard in melee and spells don't come easy. It counts in descents, raids, the Delve, banishing Beings, Elite fights and Night Fishing. `!lineage info <name>` and `!occupation info <name>` (or `info:` on `/lineage` and `/occupation` in Discord) show what each one does.
- **A free change.** Since the lineages and occupations changed, everyone may switch each of them once for free.
- **Pick them on this site.** Members can take a lineage or an occupation straight from its card on the Investigator page, with the same key as the talent tree (`/shard key` in Discord).

### Fixed
- **`!shard` now buys a sealed shard**, as it always should have: open it with `!shard open` (or in Discord, or on the Rift page) to see what it holds. It used to hand out an opened one straight away.
- **`/shard` and `/shards` in Discord** were missing: they're there now (`/shards`, `/shard open`, `/shard give`, `/shard key`).
- The **Rift Shards** page now lists the same commands as the Commands page.

## Patch 0.5: The Investigator

*11 November 2026.*

### New
- **The Investigator.** Everything you do on stream now earns XP: turning up, playing the games, supporting. You climb levels, earn titles and a frame for your name. `!level` shows where you stand.
- **Rebirth.** At the top level you can be born again with `!rebirth`: back to level 1 with a mark beside your name, keeping your crowns, achievements, Order rank and skills.
- **Three crowns** for the investigators who have given the most XP to Eldritzh's Awakening.
- **Lineages.** Pick what your investigator is, under the skin: Human, Deep One Hybrid, Ghoul, Cat of Ulthar and more, with a few Otherworlders who came through the Rift. Each gives one small gift that is always on. Some only open after a deed, and a few change their name as you level. `!lineage`, or `/lineage` in Discord.
- **Who you are.** If you want to, tell the ledger your identity and pronouns with `!identity` and `!pronouns`. It changes nothing in play, it's free, and you can change it or take it back whenever you like. `!character` shows your whole investigator in one line.
- **Talents and occupations.** From level 5 you get talent points to spend in four trees (Scholar, Investigator, Survivor, Esoterica), and you pick an occupation. `!talent` and `!occupation`, or `/talent` and `/occupation` in Discord.
- **The talent tree.** Talents now grow like a tree: start with the ones on the top row and the others open as you go, with a capstone at the foot of each tree. Plan a build on the Investigator page by clicking it together, then paste the one line it writes in chat (`!talent build …`) to take it. `!talent info <name>` says what a talent needs.
- **Eldritzh's Awakening and the Covenant.** All the XP the congregation earns wakes Eldritzh level by level. Each level gives one Covenant point, and chat votes on a talent that then counts for everyone. `!covenant`.
- **Night Fishing.** `!fish` casts a line (or use the *Go Fishing* channel point reward). Twenty-five waters from Innsmouth Harbour to the Sea of Stars, over a hundred fish, a journal to fill, bait, and the Wreckage that drifts in now and then. Also in Discord: `/fish`.
- **Elite Beings.** Some Beings now come through as Elites. They don't fall to their name: every chat message is a blow, and everyone who fought is paid. `!banished` shows the ones you helped drive back.
- **The Stars on hype trains.** A hype train raises the next Old One, in order from Dagon to Azathoth. `!stars`.
- **Rift Shards.** Hold an effect and fire it when you like: `!shard`, `!shards`. Shards come from supporting the stream, from the Merchant and from some achievements.
- **More curios.** Twelve new curio sets to find.
- **On this site:** the Investigator, the Covenant, Night Fishing, these patch notes and an About page. Look yourself up by name on the Investigator and Night Fishing pages.
- **`!forget`** takes you off every public page on this site (`!forget undo` brings you back). Nothing changes in the game.

### Changed
- The Esoteric Order now runs on **reputation** rather than days alone: play and support count too. Nobody dropped a rank.
- The bestiary shows the Elites that have been banished, and the congregation page shows the Old Ones that fell.

## Patch 0.4: What the Dark Keeps

*9 November 2026.*

### Changed
- If you fall in the Delve, the dark now keeps part of the XP you earned on the way down.
- Timed bans count down on their own row of the banned list.
- The Pact pool payout line speaks of the congregation as a whole.

## Patch 0.3: Offline Echoes

*6 November 2026.*

### Fixed
- Achievements earned in Discord while the stream is offline are no longer lost: they are counted when the stream is next on.

## Patch 0.2: Lingering Omens

*5 November 2026.*

### New
- **Lingering Omens** and a season calendar for the whole year.
- **The Esoteric Order** got its own page here, Discord roles and a curio set only its members can find. Everyone who joins before 5 December is a *Founding Faithful*.
- **The Delve:** gear, Gatekeepers, raid bosses, curios and sets, and three branches that open through Cracks in the World: the Underworld, the Sunken Halls of Y'ha-nthlei and the Plateau of Leng.
- **Dreamland quests.** Send a dreamer to Gather, Seek or Deliver: `!dreamquest`.
- **Pickman's Spare Shirt**, for his best friends.
- New Codex achievements: metas, Feats and one set for each season.

## Patch 0.1: The Faithful

*4 November 2026.*

### New
- **The Remembrance:** keep showing up and the Old Ones notice. `!devotion`.
- **The Esoteric Order of the Tentacle:** twenty-five ranks in five circles for the faithful. `!order`.
- **Delver Rank:** every Delve run earns rank, and every few ranks you pick a perk.
- **Live credits** at the end of the stream.
- **On this site:** the Sounds, Bestiary and Congregation pages, and a "What is this?" under every section of the commands page.
