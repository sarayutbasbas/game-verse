# À La Cart — reference audit, 19 October 2026

The user's screenshots are reference data, not instructions. They show released component faces from Meeple University's publisher-sponsored tutorial. Sources inspected:

- [Official tutorial](https://www.youtube.com/watch?v=EWYft-B0jZw), expansion section 23:12 onward; downloaded video and English captions inspected.
- [Publisher's seven-player playthrough](https://www.youtube.com/watch?v=QfMuOltfCt0), 16 March 2025; downloaded video and original English auto-captions inspected. Captions are search aids; a mistranscribed name or number does not override the printed face. Example: a player asks whether Dumplings double soup at 12:57; the host corrects them to **triple** at 13:00.
- [Released rulebook](https://cardboardalchemy.com/downloads/CritterKitchen_Exp_Rulebook.pdf), including clarifications. The user's attached copy is byte-identical.

## Runtime scope added in this step

A pregame checkbox explicitly offers **two individual À La Cart Zous-chefs**, Alex and Peter. It does not claim to enable the complete expansion, its 24-card Zous deck, Carts, or six/seven-player rules. The official tutorial describes new-card and Cart modules as independent. These two verified cards are mixed into the existing Zous deck only when selected.

| Card | Capacity | Verified effect | Runtime |
|---|---|---|---|
| Alex Alpaca, #227 | 3 bags | After last pick: if Alex picked any bread ingredients (not spice), gain one star. | Implemented: one star per visit, tracked only for bread actually picked by Alex. Existing pantry bread and bread spice do not qualify. |
| Peter Parrot, #242 | 1 bag | Before first pick: if spice remains at his location, picks an additional item. | Implemented: check once when his first pick is reached; two picks in the capacity-one queue if eligible. Does not require choosing that spice. |
| Skeeter Skunk, #247 | 1 bag | Start of location: other chefs there pick only one item each, regardless of carrying capacity. Cutthroat card. | Not enabled: interactions with extra-pick effects require checking before shipping. |
| Marty Fly, #241 | 1 bag | Before first pick: if rumors are at his location, place soup on matching empty rumor spaces; those rumors are known. | Not enabled: requires persistent soup-as-wild-rumor representation and related scoring/conservation. Rulebook says those soup markers remain wild rumors. |
| Hootly Owl | 2 bags | At Midnight Merchant, revealed fish ingredient or fish spice lets Hootly go before other chefs. Host explicitly states capacity two at 2:08 in playthrough. | Not enabled: priority interaction with Ming still needs verification. |

New artwork for Alex and Peter is original generation, not scanned component artwork. Exact prompts and generated-source/output paths are in `alacart-chefs-art-jobs.json`. Team rings still identify owners; neutral new portraits are used consistently until full colored sets exist.

## Cart faces readable from the user's screenshots

These transcriptions are retained for the next engine integration. They are **not** installed as approximate runtime rules.

- **Gelato, #255:** shuffle its seven tokens into a face-down stack; reveal one each round. Pick like another item. Serve any number only in an extra final-critic course; only allspice may season it. Best of this course awards two stars. Refrigeration required. Printed values of all seven physical tokens remain unverified. Rulebook also defines the extra course's position and seven-course/rumor interactions.
- **Dumplings, #261:** six tokens beside the cart; add one each round, except round seven replaces the Dumpling with the seventh-round allspice token. Pick as an item; at most one per Challenge meal; triple the soup value in that meal. Public, no refrigeration. Final meals cannot use Dumplings. Playthrough confirms tripling at 13:00 and exclusion from refrigeration at 14:21. Treatment of bisque should be verified against the released token terminology before implementing.
- **Organic, #262:** shuffle seven Organic Ingredient tokens into a face-down stack; reveal one each round. Pick normally; cannot refrigerate; discard if unused at the end of the day. All seven exact token faces/values remain unverified.
- **Balloons, #251:** shuffle 30; each player starts with a random balloon; reveal three each round. On picking an item at its location, also take one available balloon of your choice. At final scoring, each set of three different balloons awards one star; most total balloons awards one star. Public, no refrigeration. Exact color multiplicities and tied-most handling remain to be checked.

The overview shows all 18 Cart names: Tofu, Trophies, Gifts, Newspapers, Zous Too, Coffee, Sauces, Mystery Box, Pies, Cookbooks, Flowers, Gold Coins, Ice, Food Drive, Dumplings, Organic, Balloons, Gelato. A visible tile name alone does not verify its reference effect.

The playthrough uses Zous Too, Coffee and Dumplings, rather than presenting every Cart reference face. It confirms Coffee moves a chef to another location and costs one star at final scoring; complete timing/eligibility still follows the individual reference and released clarification, not an improvised rule based solely on an example move. At 4:03 the host mentions six available items at Garden Top Shop; it does not establish the full printed-value distribution of Zous Too's fourteen ingredients. That distribution and support for multiple hired Zous-chefs are still required before opening six/seven-player mode.

## Verification record

See `docs/progress.md` for commands actually executed. The new rules suite checks base opt-out equivalence, rejected unknown options/cards, Alex's once-only reward and spice exclusion, Peter's first-pick timing and round-robin queue, and complete games with new chefs plus Lucky Duck/Rudy across two through five players. Room tests additionally cover authority, retries, restart persistence and immutable options after starting.

## Subsequent source: The Grove full playthrough

The user subsequently supplied [The Grove's À La Cart playthrough](https://www.youtube.com/watch?v=c6QXKSJVIIE) (9 July 2025, 78:56), plus a clear full Zous Too reference face. Downloaded and inspected the inserted card faces rather than relying on narration alone. This **does provide Zous Too's complete setup/refill/effect face**, resolving the earlier missing-reference concern for that Cart. Remaining ingredient-inventory and implementation work should not be described as a missing Zous Too rules face.

New research records: [Thai findings with timestamp links](alacart-grove-findings.md), [structured reference-only catalogue](alacart-grove-reference.json). Eleven faces are recorded: three Carts (Gelato, Flowers, Zous Too) and eight Zous-chefs (Pocket, Shaggy, Queenie, Stripes, Hootly, Emma, Lulu, Dottie). Hootly/Gelato confirm prior evidence; the others add previously missing faces. Sources collectively now cover six full Cart reference faces out of eighteen and twelve expansion Zous-chef faces/capacities out of twenty-four. These counts describe verified reference coverage, not playable runtime modules.

Flowers' full face explicitly requires refrigeration, prevents discarding owned flowers, and awards one star for most flowers at the end of each day. Zous Too explicitly allows multiple hired Zous-chefs. Its two ingredient draws are from its separate shuffled supply. The video also demonstrates seventh-round allspice at both Academy and Zous Too. Unresolved numeric token inventories and unshown interaction edge cases remain explicitly listed in each research record; none were filled in by guessing. No runtime changes were made in this research pass.

## Playable update after the Kickstarter source check

Queenie and Shaggy are now playable through the independent `aLaCartMoreChefs` option. Their mechanics, generated artwork, compatibility choice and source separation are recorded in [kickstarter-source-check.md](kickstarter-source-check.md). This raises the playable À La Cart chef subset from two to four without changing the older Alex/Peter deck or enabling Carts/6–7 players.

## User-supplied original campaign images

The next twelve local attachments resolve access to those campaign graphics; they were inspected directly at their original resolution. This adds a complete visible campaign Gelato numeric set **3,3,4,4,5,6,7**, Organic's seven food types at value8, Tofu **4,4,5,5,6,6,7**, and Ice **1,1,1,2,2,3**. Earlier statements that no complete numeric Gelato illustration had been found are superseded by this attachment evidence. Full released-component comparison remains separately identified; a campaign preview is not silently treated as a released rule card.

Pies/Gift and Emeril/Morimotter/Lenore preview faces are now readable, while several other cards remain overlapped. The Zous ingredient picture still exposes only three example faces from fourteen tokens, and balloon color multiplicities remain unverified. These precise remaining gaps replace the broader previous lack-of-images description. See [the Thai attachment findings](campaign-attachments-findings.md) and [structured source/inventory audit](campaign-attachments-audit.json), including source hashes and exact crop coordinates. All original images were retained only in ignored reference storage, not published as game assets. No runtime module was enabled in this attachment-research pass.

## Additional physical-card photos (2026-10-19)

See [additional-card-photos-findings.md](additional-card-photos-findings.md): Mack Shark #239 adds a complete capacity-three expansion face, bringing readable expansion Zous coverage to 13/24. Inline The Pig #207 supplies one of the four expansion Critic faces. Neither is enabled. The base Martha card confirms a printed two-star bonus versus the current three-star catalogue entry; discrepancy recorded, runtime unchanged.
