# Illustrated game introductions and returning rooms

Every catalogue game has an introduction before room creation/joining in `src/client/game-learning.ts`. `GAME_GUIDES` is typed against the complete `GameId` union so newly added games must supply learning content. Content follows the implemented editions/scopes in `docs/games/<id>/rules.md`; it does not enable rules, infer unreleased expansions, or expose match state.

Priority content is Harmonies, Critter Kitchen, Pixies and Take Time, with additional steps and numerical examples. All thirteen games have a Thai pitch, playing experience, objective, three illustrated opening steps, expandable scoring/tips and an honest implemented-scope note. Reused game assets are paired with native teaching diagrams (terrain stacks, fixed numbered grid, card pair validation and clock totals). There are no generated stock illustrations or new dependencies. Captions distinguish examples from actual setup or complete meal recipes.

Game details show the introduction before the room controls. A skip link takes returning players directly to those controls. Expand/collapse choice persists across account/presence rerenders within the session. Name It uses its local pregame entry with a skip link to seat setup, since it does not use network rooms.

The shared room menu opens the same illustrated content in an accessible native dialog for all network games. Existing Harmonies, Critter Kitchen, Pixies, Take Time, Jaipur, Azul, Sky Team, Locus, 7 Wonders Duel, Dracula and Camel Up help views include the illustrations while retaining game-specific details; Name It already has a detailed illustrated local guide. Calico receives the shared room-menu guide.

Returning-room rows show the game thumbnail/name, room code and phase together. Role-specific play/display destinations and close permissions remain unchanged. Existing versioned box selection is reused to avoid the old Take Time image cache.

Visual direction follows the existing portal: paper background, teal text, Thai font, quiet illustration panels and numbered real action sequences. Diagrams/labels explain choices rather than using box artwork as the only instructional picture. Phone introductions use full-width images with text below; desktop uses three preview columns. In-game dialogs alternate illustrations and text on wide screens and stack on phones. Native details/dialog/button controls retain keyboard and Escape behavior.

Verification: see `docs/progress.md`, browser cases `tests/browser/game-learning.spec.ts` and screenshots under ignored `data/qa-game-learning/`.
