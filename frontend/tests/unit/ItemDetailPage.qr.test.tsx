// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemDetailPage } from "../../src/pages/admin/ItemDetailPage";

type Params = { id: string };

const h = vi.hoisted(() => ({
  params: { id: "1" } as Params,
  search: "",
  mockItemResponse: {} as unknown,
  mockNavigate: vi.fn(),
  mockInvalidateQueries: vi.fn(),
  mockShowToast: vi.fn(),
  uploadFile: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({
      data: {},
    })),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({
      ok: true,
      data: { item: { id: "new123" } },
    })),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({
      ok: true,
      data: { item: { id: "1" } },
    })),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => ({})),
  },
}));

function createBaseItemData() {
  return {
    item: {
      id: "1",
      name: "Ferrari F40",
      description: "",
      status: "con_hang",
      is_public: false,
      condition: "new",
    },
    images: [],
    spin_sets: [],
    facebook_posts: [],
  };
}

const QR_RESPONSE = {
  data: {
    token: "abc123def456789a",
    resolve_url: "https://api.example.com/api/v1/public/qr/abc123def456789a",
    image_data_url: "data:image/png;base64,MOCKQR",
  },
};

vi.mock("react-router-dom", () => ({
  useParams: () => h.params,
  useNavigate: () => h.mockNavigate,
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href: String(to), ...rest }, children),
  useSearchParams: () => {
    const [params, setParams] = React.useState(
      () => new URLSearchParams(h.search),
    );
    const setSearchParams = React.useCallback(
      (
        next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
      ) => {
        setParams((prev) => {
          const resolved = typeof next === "function" ? next(prev) : next;
          h.search = resolved.toString();
          return new URLSearchParams(resolved.toString());
        });
      },
      [],
    );
    return [params, setSearchParams] as const;
  },
}));

vi.mock("../../src/api/client", () => ({
  apiClient: h.apiClient,
  uploadFile: (...args: unknown[]) => h.uploadFile(...args),
}));

vi.mock("../../src/utils/toast", () => ({
  showToast: (...args: unknown[]) => h.mockShowToast(...args),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "item") {
      return { data: h.mockItemResponse, isLoading: false };
    }
    if (queryKey[0] === "categories") {
      return { data: { categories: [] }, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  },
  useQueryClient: () => ({
    invalidateQueries: h.mockInvalidateQueries,
  }),
  useMutation: (options: {
    mutationFn: (vars: unknown) => Promise<unknown>;
    onSuccess?: (response: unknown, variables: unknown) => void | Promise<void>;
  }) => {
    const mutateAsync = vi.fn(async (vars: unknown) => {
      const response = await options.mutationFn(vars);
      if (options.onSuccess) {
        await options.onSuccess(response, vars);
      }
      return response;
    });
    return {
      mutate: (vars: unknown) => void mutateAsync(vars),
      mutateAsync,
      isPending: false,
    };
  },
}));

describe("ItemDetailPage — QR step 5", () => {
  beforeEach(() => {
    h.params = { id: "1" };
    h.search = "";
    h.mockItemResponse = createBaseItemData();
    h.apiClient.get.mockImplementation(async (url: unknown) => {
      if (typeof url === "string" && url.includes("/qr")) {
        return QR_RESPONSE;
      }
      return { data: h.mockItemResponse };
    });
    h.apiClient.post.mockImplementation(async () => ({
      ok: true,
      data: { item: { id: "new123" } },
    }));
    h.apiClient.patch.mockImplementation(async () => ({
      ok: true,
      data: { item: { id: "1" } },
    }));
    h.mockNavigate.mockReset();
    h.mockInvalidateQueries.mockReset();
    h.mockShowToast.mockReset();
    h.uploadFile.mockReset();
    h.apiClient.get.mockClear();
    h.apiClient.post.mockClear();
    h.apiClient.patch.mockClear();
    h.apiClient.delete.mockClear();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => undefined),
      },
    });
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("Step 5 tab appears in stepper", async () => {
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Mã QR/i })[0]).toBeTruthy();
    });
  });

  it("QR image renders when entering step 5", async () => {
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      const img = screen.getByAltText("Mã QR sản phẩm");
      expect(img).toBeTruthy();
      expect((img as HTMLImageElement).src).toBe(
        "data:image/png;base64,MOCKQR",
      );
    });
  });

  it("apiClient.get called with /items/1/qr when entering step 5", async () => {
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(h.apiClient.get).toHaveBeenCalledWith(
        "/items/1/qr",
        expect.anything(),
      );
    });
  });

  it("QR not re-fetched on second visit to step 5", async () => {
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(screen.getByAltText("Mã QR sản phẩm")).toBeTruthy();
    });

    h.apiClient.get.mockClear();

    fireEvent.click(screen.getAllByRole("button", { name: /Hình ảnh/i })[0]);
    await waitFor(() => {
      expect(h.apiClient.patch).toHaveBeenCalled();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /Mã QR/i })[0]);
    await waitFor(() => {
      expect(screen.getByAltText("Mã QR sản phẩm")).toBeTruthy();
    });

    const qrCallsAfter = h.apiClient.get.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("/qr"),
    );
    expect(qrCallsAfter.length).toBe(0);
  });

  it("Private item shows warning banner", async () => {
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/riêng tư/i)).toBeTruthy();
    });
  });

  it("resolve_url displayed in URL box", async () => {
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(
        screen.getByText(
          "https://api.example.com/api/v1/public/qr/abc123def456789a",
        ),
      ).toBeTruthy();
    });
  });

  it("Error state shown on API failure", async () => {
    h.apiClient.get.mockImplementation(async (url: unknown) => {
      if (typeof url === "string" && url.includes("/qr")) {
        throw new Error("Network error");
      }
      return { data: h.mockItemResponse };
    });
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(
        screen.getByText("Không thể tải mã QR. Vui lòng thử lại."),
      ).toBeTruthy();
    });
  });

  it("Retry button re-triggers fetch and shows QR on success", async () => {
    h.apiClient.get.mockImplementation(async (url: unknown) => {
      if (typeof url === "string" && url.includes("/qr")) {
        throw new Error("Fetch fails");
      }
      return { data: h.mockItemResponse };
    });
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(
        screen.getByText("Không thể tải mã QR. Vui lòng thử lại."),
      ).toBeTruthy();
    });

    h.apiClient.get.mockImplementation(async (url: unknown) => {
      if (typeof url === "string" && url.includes("/qr")) {
        return QR_RESPONSE;
      }
      return { data: h.mockItemResponse };
    });
    h.apiClient.get.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));

    await waitFor(() => {
      expect(screen.getByAltText("Mã QR sản phẩm")).toBeTruthy();
    });

    const qrCalls = h.apiClient.get.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("/qr"),
    );
    expect(qrCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("Copy link button calls navigator.clipboard.writeText with resolve_url and shows success toast", async () => {
    h.search = "step=5";
    render(<ItemDetailPage />);
    await waitFor(() => {
      expect(screen.getByAltText("Mã QR sản phẩm")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/public/qr/abc123def456789a",
      );
      expect(h.mockShowToast).toHaveBeenCalledWith(
        "Đã copy link QR",
        "success",
      );
    });
  });

  it("Does not fetch QR for new item and shows no QR content", async () => {
    h.params = { id: "new" };
    h.search = "step=5";
    h.mockItemResponse = {
      item: null,
      images: [],
      spin_sets: [],
      facebook_posts: [],
    };
    h.apiClient.get.mockImplementation(async (url: unknown) => {
      if (typeof url === "string" && url.includes("/qr")) {
        return QR_RESPONSE;
      }
      return { data: h.mockItemResponse };
    });

    render(<ItemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tạo sản phẩm mới/i)).toBeTruthy();
    });

    await new Promise((r) => setTimeout(r, 200));

    expect(screen.queryByAltText("Mã QR sản phẩm")).toBeNull();

    const qrCalls = h.apiClient.get.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("/qr"),
    );
    expect(qrCalls.length).toBe(0);
  });
});
