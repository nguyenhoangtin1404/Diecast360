import { Sparkles, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../../api/client";
import { showToast } from "../../../../utils/toast";
import type { FacebookPost } from "../../../../types/item.types";
import type { AiDescriptionResponse } from "../types";

interface Props {
  id: string;
  isMobile: boolean;
  socialSellingRef: React.RefObject<HTMLDivElement | null>;

  fbPostContent: string;
  setFbPostContent: (v: string) => void;
  fbPostInstructions: string;
  setFbPostInstructions: (v: string) => void;
  isGeneratingFbPost: boolean;
  setIsGeneratingFbPost: (v: boolean) => void;
  facebookPosts: FacebookPost[];
  setFacebookPosts: React.Dispatch<React.SetStateAction<FacebookPost[]>>;
  newFbLinkInput: string;
  setNewFbLinkInput: (v: string) => void;
  isSavingFbLink: boolean;
  setIsSavingFbLink: (v: boolean) => void;
  isPublishingToFb: boolean;
  setIsPublishingToFb: (v: boolean) => void;
  publishFbMessage: string | null;
  setPublishFbMessage: (v: string | null) => void;

  showAiPreview: boolean;
  setShowAiPreview: (v: boolean) => void;
  aiDescription: AiDescriptionResponse | null;
  setAiDescription: (v: AiDescriptionResponse | null) => void;
  aiPreviewTab: "short" | "long" | "bullets" | "seo";
  setAiPreviewTab: (v: "short" | "long" | "bullets" | "seo") => void;
  handleAcceptAiDescription: () => void;
}

export function ItemAiSection({
  id,
  isMobile,
  socialSellingRef,
  fbPostContent,
  setFbPostContent,
  fbPostInstructions,
  setFbPostInstructions,
  isGeneratingFbPost,
  setIsGeneratingFbPost,
  facebookPosts,
  setFacebookPosts,
  newFbLinkInput,
  setNewFbLinkInput,
  isSavingFbLink,
  setIsSavingFbLink,
  isPublishingToFb,
  setIsPublishingToFb,
  publishFbMessage,
  setPublishFbMessage,
  showAiPreview,
  setShowAiPreview,
  aiDescription,
  setAiDescription,
  aiPreviewTab,
  setAiPreviewTab,
  handleAcceptAiDescription,
}: Props) {
  const queryClient = useQueryClient();

  return (
    <>
      <div ref={socialSellingRef}>
        <h2
          style={{
            marginTop: "40px",
            fontSize: "24px",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "20px",
            paddingBottom: "12px",
            borderBottom: "2px solid #f0f0f0",
          }}
        >
          Social Selling
        </h2>

        {facebookPosts.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 18px",
              background:
                "linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)",
              borderRadius: "10px",
              border: "1px solid #bbdefb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "18px" }}>✅</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1b5e20",
                }}
              >
                Đã đăng Facebook ({facebookPosts.length} bài)
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {facebookPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    gap: "8px",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(post.posted_at).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#1877F2",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.post_url}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexShrink: 0,
                      flexWrap: "wrap",
                    }}
                  >
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "4px 10px",
                        background: "#1877F2",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        fontSize: "12px",
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      🔗 Mở
                    </a>
                    <button
                      onClick={async () => {
                        if (!confirm("Bạn muốn xóa bài FB này?"))
                          return;
                        try {
                          await apiClient.delete(
                            `/items/${id}/facebook-posts/${post.id}`,
                          );
                          setFacebookPosts((prev) =>
                            prev.filter((p) => p.id !== post.id),
                          );
                          showToast("Đã xóa bài FB!");
                          queryClient.invalidateQueries({
                            queryKey: ["items"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["fb-posts"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["item", id],
                          });
                        } catch {
                          alert("Không thể xóa. Vui lòng thử lại.");
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        background: "#f5f5f5",
                        color: "#dc3545",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Yêu cầu bổ sung (tùy chọn):
          </label>
          <input
            type="text"
            value={fbPostInstructions}
            onChange={(e) => setFbPostInstructions(e.target.value)}
            placeholder="VD: Thêm hashtag trending, nhấn mạnh giá sale..."
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        <button
          onClick={async () => {
            setIsGeneratingFbPost(true);
            try {
              const response = await apiClient.post(
                `/items/${id}/fb-post`,
                {
                  custom_instructions: fbPostInstructions || undefined,
                },
              );
              setFbPostContent(response.data?.content || "");
            } catch (error) {
              console.error("Error generating FB post:", error);
              alert("Có lỗi khi tạo bài FB. Vui lòng thử lại.");
            } finally {
              setIsGeneratingFbPost(false);
            }
          }}
          disabled={isGeneratingFbPost}
          style={{
            padding: "12px 24px",
            background: isGeneratingFbPost
              ? "#ccc"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: isGeneratingFbPost ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            width: isMobile ? "100%" : "auto",
            justifyContent: "center",
          }}
        >
          <Sparkles size={18} />
          {isGeneratingFbPost ? "Đang tạo..." : "Tạo bài FB bằng AI"}
        </button>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Nội dung bài đăng:
          </label>
          <textarea
            value={fbPostContent}
            onChange={(e) => setFbPostContent(e.target.value)}
            placeholder="Nội dung bài FB sẽ hiển thị ở đây sau khi AI tạo. Bạn có thể chỉnh sửa trực tiếp..."
            style={{
              width: "100%",
              minHeight: "200px",
              padding: "14px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              fontSize: "14px",
              lineHeight: "1.6",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={async () => {
              if (!fbPostContent) {
                alert("Chưa có nội dung để copy!");
                return;
              }
              try {
                await navigator.clipboard.writeText(fbPostContent);
                showToast("Đã copy nội dung!");
              } catch {
                alert("Không thể copy. Vui lòng thử lại.");
              }
            }}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            📋 Copy nội dung
          </button>
          <button
            onClick={async () => {
              try {
                const link = `${window.location.origin}/items/${id}`;
                await navigator.clipboard.writeText(link);
                showToast("Đã copy link!");
              } catch {
                alert("Không thể copy. Vui lòng thử lại.");
              }
            }}
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            🔗 Copy Link SP
          </button>
          <button
            onClick={async () => {
              if (!fbPostContent) {
                alert("Chưa có nội dung để lưu!");
                return;
              }
              try {
                await apiClient.patch(`/items/${id}`, {
                  fb_post_content: fbPostContent,
                });
                queryClient.invalidateQueries({ queryKey: ["items"] });
                queryClient.invalidateQueries({
                  queryKey: ["fb-posts"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["item", id],
                });
                showToast("Đã lưu nội dung!");
              } catch (error) {
                console.error("Error saving FB post:", error);
                alert("Không thể lưu. Vui lòng thử lại.");
              }
            }}
            style={{
              padding: "10px 20px",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            💾 Lưu nội dung
          </button>
          <button
            onClick={async () => {
              if (!fbPostContent) {
                alert("Chưa có nội dung! Tạo bài FB trước khi đăng.");
                return;
              }
              try {
                await navigator.clipboard.writeText(fbPostContent);
                await apiClient.patch(`/items/${id}`, {
                  fb_post_content: fbPostContent,
                });
                queryClient.invalidateQueries({ queryKey: ["items"] });
                queryClient.invalidateQueries({
                  queryKey: ["fb-posts"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["item", id],
                });
                window.open("https://www.facebook.com/", "_blank");
                showToast(
                  "✅ Đã copy nội dung! Hãy paste và đăng trên Facebook.",
                  "#1877F2",
                  4000,
                );
              } catch {
                alert("Không thể copy. Vui lòng thử lại.");
              }
            }}
            style={{
              padding: "10px 20px",
              background: "#1877F2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📤 Đăng lên Facebook
          </button>
          <button
            onClick={async () => {
              if (!fbPostContent) {
                alert(
                  "Chưa có nội dung! Tạo bài FB trước khi publish.",
                );
                return;
              }
              if (
                !window.confirm(
                  "Bạn có chắc muốn publish bài này lên Facebook Page? Hành động này không thể hoàn tác.",
                )
              ) {
                return;
              }
              setIsPublishingToFb(true);
              setPublishFbMessage(null);
              try {
                const response = await apiClient.post(
                  `/items/${id}/facebook-posts/publish`,
                  {
                    content: fbPostContent,
                  },
                );
                const responseData = response.data as {
                  post?: FacebookPost;
                };
                const newPost = responseData.post;
                if (newPost) {
                  setFacebookPosts((prev) => [newPost, ...prev]);
                }
                queryClient.invalidateQueries({ queryKey: ["items"] });
                queryClient.invalidateQueries({
                  queryKey: ["fb-posts"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["item", id],
                });
                setPublishFbMessage(
                  "✅ Đã đăng thành công lên Facebook!",
                );
                showToast(
                  "✅ Đã publish lên Facebook!",
                  "#28a745",
                  4000,
                );
              } catch (error) {
                console.error("Error publishing to FB:", error);
                const err = error as {
                  response?: { data?: { message?: string } };
                };
                const msg =
                  err?.response?.data?.message ||
                  "Không thể publish. Vui lòng thử lại.";
                setPublishFbMessage(`❌ ${msg}`);
              } finally {
                setIsPublishingToFb(false);
              }
            }}
            disabled={isPublishingToFb || !fbPostContent}
            style={{
              padding: "10px 20px",
              background:
                isPublishingToFb || !fbPostContent ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor:
                isPublishingToFb || !fbPostContent
                  ? "not-allowed"
                  : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isPublishingToFb
              ? "⏳ Đang publish..."
              : "🚀 Publish lên Facebook"}
          </button>
        </div>

        {publishFbMessage && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
              background: publishFbMessage.startsWith("✅")
                ? "#d4edda"
                : "#f8d7da",
              color: publishFbMessage.startsWith("✅")
                ? "#155724"
                : "#721c24",
              border: `1px solid ${publishFbMessage.startsWith("✅") ? "#c3e6cb" : "#f5c6cb"}`,
            }}
          >
            {publishFbMessage}
          </div>
        )}

        <div
          style={{
            padding: "18px",
            background: "#f8f9fa",
            borderRadius: "10px",
            border: "1px dashed #dee2e6",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            📌 Thêm link bài đăng Facebook
          </label>
          <p
            style={{
              fontSize: "13px",
              color: "#666",
              margin: "0 0 12px 0",
            }}
          >
            Sau khi đăng xong trên Facebook, dán link bài viết vào đây
            để lưu lại.
          </p>
          <div
            style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
          >
            <input
              type="url"
              value={newFbLinkInput}
              onChange={(e) => setNewFbLinkInput(e.target.value)}
              placeholder="https://www.facebook.com/..."
              style={{
                flex: "1 1 260px",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <button
              onClick={async () => {
                if (!newFbLinkInput) {
                  alert("Vui lòng nhập link bài Facebook!");
                  return;
                }
                if (
                  !newFbLinkInput.includes("facebook.com") &&
                  !newFbLinkInput.includes("fb.com")
                ) {
                  alert(
                    "Link không hợp lệ! Vui lòng nhập link Facebook.",
                  );
                  return;
                }
                setIsSavingFbLink(true);
                try {
                  const response = await apiClient.post(
                    `/items/${id}/facebook-posts`,
                    {
                      post_url: newFbLinkInput,
                      content: fbPostContent || undefined,
                    },
                  );
                  const responseData = response.data as {
                    post?: FacebookPost;
                  };
                  const newPost = responseData.post;
                  if (newPost) {
                    setFacebookPosts((prev) => [newPost, ...prev]);
                  }
                  setNewFbLinkInput("");
                  queryClient.invalidateQueries({
                    queryKey: ["items"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["fb-posts"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["item", id],
                  });
                  showToast("✅ Đã lưu link bài Facebook!");
                } catch (error) {
                  console.error("Error saving FB link:", error);
                  alert("Không thể lưu. Vui lòng thử lại.");
                } finally {
                  setIsSavingFbLink(false);
                }
              }}
              disabled={isSavingFbLink}
              style={{
                padding: "10px 20px",
                background: isSavingFbLink ? "#ccc" : "#1877F2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isSavingFbLink ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isSavingFbLink ? "Đang lưu..." : "➕ Thêm link FB"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Description Preview Modal */}
      {showAiPreview && aiDescription && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "80vh",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Sparkles size={24} color="#667eea" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  AI Generated Content
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAiPreview(false);
                  setAiDescription(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #eee",
                background: "#f8f9fa",
              }}
            >
              {(["short", "long", "bullets", "seo"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAiPreviewTab(tab)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "none",
                    background: aiPreviewTab === tab ? "white" : "transparent",
                    borderBottom:
                      aiPreviewTab === tab
                        ? "2px solid #667eea"
                        : "2px solid transparent",
                    color: aiPreviewTab === tab ? "#667eea" : "#666",
                    fontWeight: aiPreviewTab === tab ? "600" : "400",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {tab === "short" && "Mô tả ngắn"}
                  {tab === "long" && "Mô tả chi tiết"}
                  {tab === "bullets" && "Bullet specs"}
                  {tab === "seo" && "SEO Meta"}
                </button>
              ))}
            </div>

            <div
              style={{
                padding: "24px",
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              {aiPreviewTab === "short" && (
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "12px",
                    }}
                  >
                    Mô tả ngắn cho Facebook post (50-80 từ):
                  </p>
                  <div
                    style={{
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {aiDescription.short_description}
                  </div>
                </div>
              )}
              {aiPreviewTab === "long" && (
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "12px",
                    }}
                  >
                    Mô tả chi tiết cho website (150-200 từ):
                  </p>
                  <div
                    style={{
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {aiDescription.long_description}
                  </div>
                </div>
              )}
              {aiPreviewTab === "bullets" && (
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "12px",
                    }}
                  >
                    Bullet specs (5-7 điểm):
                  </p>
                  <ul
                    style={{
                      padding: "16px 16px 16px 32px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      fontSize: "14px",
                      lineHeight: "1.8",
                      margin: 0,
                    }}
                  >
                    {aiDescription.bullet_specs.map((spec, idx) => (
                      <li key={idx}>{spec}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiPreviewTab === "seo" && (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        marginBottom: "8px",
                      }}
                    >
                      Meta Title (max 60 ký tự):
                    </p>
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      {aiDescription.meta_title}
                    </div>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        marginBottom: "8px",
                      }}
                    >
                      Meta Description (max 155 ký tự):
                    </p>
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    >
                      {aiDescription.meta_description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #eee",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowAiPreview(false);
                  setAiDescription(null);
                }}
                style={{
                  padding: "10px 20px",
                  background: "#f8f9fa",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleAcceptAiDescription}
                style={{
                  padding: "10px 20px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Áp dụng mô tả chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
