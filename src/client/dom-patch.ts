/** Keep live controls, image nodes and scroll anchors when presentation changes.
 * Keys are stable card IDs, never display indices. No game state lives here. */
export function patchHTML(root: HTMLElement, html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;
  patch(root, template.content);
}
function key(node: Node): string | undefined {
  if (!(node instanceof Element)) return;
  for (const name of [
    "id",
    "data-ui-key",
    "data-market",
    "data-hand",
    "data-trader",
  ]) {
    if (node.hasAttribute(name)) return name + ":" + node.getAttribute(name);
  }
}
function patch(root: Node, next: Node) {
  const old = [...root.childNodes];
  const used = new Set<Node>();
  let cursor = root.firstChild;
  for (const desired of [...next.childNodes]) {
    const wantedKey = key(desired);
    const current = old.find(
      (n) =>
        !used.has(n) &&
        n.nodeType === desired.nodeType &&
        (n instanceof Element && desired instanceof Element
          ? n.tagName === desired.tagName &&
            (wantedKey ? key(n) === wantedKey : !key(n))
          : !wantedKey),
    );
    if (!current) {
      root.insertBefore(desired.cloneNode(true), cursor);
      continue;
    }
    used.add(current);
    if (current !== cursor) root.insertBefore(current, cursor);
    if (current instanceof Element && desired instanceof Element) {
      for (const a of [...current.attributes])
        if (
          !desired.hasAttribute(a.name) &&
          !(a.name === "open" && current.tagName === "DETAILS")
        )
          current.removeAttribute(a.name);
      for (const a of [...desired.attributes])
        if (current.getAttribute(a.name) !== a.value)
          current.setAttribute(a.name, a.value);
      if (!current.hasAttribute("data-preserve-content"))
        patch(current, desired);
    } else if (current.nodeValue !== desired.nodeValue)
      current.nodeValue = desired.nodeValue;
    cursor = current.nextSibling;
  }
  for (const n of old) if (!used.has(n)) n.parentNode?.removeChild(n);
}
