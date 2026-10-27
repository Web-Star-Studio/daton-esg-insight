import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToTop } from "./ScrollToTop";

describe("public page scroll navigation", () => {
  let container: HTMLDivElement;
  let root: Root;
  const scrollIntoView = vi.fn();
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollIntoView",
  );

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    scrollIntoView.mockClear();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });

  async function render() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/one"]}>
          <ScrollToTop />
          <Link to="/two" data-testid="page">Page</Link>
          <Link to="/one?filter=active" data-testid="filter">Filter</Link>
          <Link to="/two#d%C3%BAvidas" data-testid="anchor">Anchor</Link>
          <Link to="/two#%E0%A4%A" data-testid="invalid">Invalid anchor</Link>
          <Routes>
            <Route path="/one" element={<main>First page</main>} />
            <Route path="/two" element={<main><section id="dúvidas">Questions</section></main>} />
          </Routes>
        </MemoryRouter>,
      );
    });
    vi.mocked(window.scrollTo).mockClear();
  }

  async function navigate(testId: string) {
    await act(async () => {
      container.querySelector<HTMLAnchorElement>(`[data-testid="${testId}"]`)!.click();
    });
  }

  it("returns to the top when switching to an already available page", async () => {
    await render();
    await navigate("page");
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("keeps the reading position when only a search parameter changes", async () => {
    await render();
    await navigate("filter");
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("opens an encoded anchor in the committed destination page", async () => {
    await render();
    await navigate("anchor");
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: "instant" });
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("dúvidas"));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("opens the page at the top when an anchor is malformed", async () => {
    await render();
    await navigate("invalid");
    expect(window.scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, left: 0, behavior: "instant" });
  });
});
