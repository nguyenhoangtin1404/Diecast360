import { Plus, X, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner360 } from "../../../../components/Spinner360/Spinner360";
import { MAX_SPINNER_FRAMES } from "../../../../constants/spinner";
import type { SpinSet } from "../types";
import type { UseMutationResult } from "@tanstack/react-query";

interface Props {
  id: string;
  spinSets: SpinSet[];
  selectedSpinSetId: string | null;
  setSelectedSpinSetId: (v: string | null) => void;
  showCreateSpinSet: boolean;
  setShowCreateSpinSet: (v: boolean) => void;
  newSpinSetLabel: string;
  setNewSpinSetLabel: (v: string) => void;
  newSpinSetIsDefault: boolean;
  setNewSpinSetIsDefault: (v: boolean) => void;
  uploadingFrames: boolean;
  createSpinSetMutation: UseMutationResult<unknown, Error, { label?: string; is_default?: boolean }, unknown>;
  updateSpinSetMutation: UseMutationResult<unknown, Error, { spinSetId: string; data: { label?: string; is_default?: boolean } }, unknown>;
  deleteFrameMutation: UseMutationResult<unknown, Error, { spinSetId: string; frameId: string }, unknown>;
  reorderFramesMutation: UseMutationResult<unknown, Error, { spinSetId: string; frameIds: string[] }, unknown>;
  handleUploadFrames: (e: React.ChangeEvent<HTMLInputElement>, spinSetId: string) => Promise<void>;
  handleMoveFrame: (spinSetId: string, frameId: string, direction: "up" | "down", spinSets: SpinSet[]) => void;
}

export function ItemSpinnerSection({
  id,
  spinSets,
  selectedSpinSetId,
  setSelectedSpinSetId,
  showCreateSpinSet,
  setShowCreateSpinSet,
  newSpinSetLabel,
  setNewSpinSetLabel,
  newSpinSetIsDefault,
  setNewSpinSetIsDefault,
  uploadingFrames,
  createSpinSetMutation,
  updateSpinSetMutation,
  deleteFrameMutation,
  reorderFramesMutation,
  handleUploadFrames,
  handleMoveFrame,
}: Props) {
  const queryClient = useQueryClient();
  const selectedSpinSet = spinSets.find((set) => set.id === selectedSpinSetId);
  const maxFramesReached =
    (selectedSpinSet?.frames?.length ?? 0) >= MAX_SPINNER_FRAMES;

  return (
    <>
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
        Spinner 360°
      </h2>

      {!showCreateSpinSet ? (
        <button
          onClick={() => setShowCreateSpinSet(true)}
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Plus size={16} />
          Tạo bộ spinner mới
        </button>
      ) : (
        <div
          style={{
            marginBottom: "20px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Tên bộ spinner (tùy chọn)"
              value={newSpinSetLabel}
              onChange={(e) => setNewSpinSetLabel(e.target.value)}
              style={{
                flex: "1 1 220px",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                minHeight: "40px",
              }}
            >
              <input
                type="checkbox"
                checked={newSpinSetIsDefault}
                onChange={(e) =>
                  setNewSpinSetIsDefault(e.target.checked)
                }
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px" }}>Đặt làm mặc định</span>
            </label>
            <button
              onClick={() => {
                createSpinSetMutation.mutate({
                  label: newSpinSetLabel || undefined,
                  is_default: newSpinSetIsDefault,
                });
              }}
              disabled={createSpinSetMutation.isPending}
              style={{
                padding: "8px 16px",
                background: createSpinSetMutation.isPending
                  ? "#ccc"
                  : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: createSpinSetMutation.isPending
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {createSpinSetMutation.isPending ? "Đang tạo..." : "Tạo"}
            </button>
            <button
              onClick={() => {
                setShowCreateSpinSet(false);
                setNewSpinSetLabel("");
                setNewSpinSetIsDefault(false);
              }}
              style={{
                padding: "8px 16px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {spinSets.length > 0 ? (
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {spinSets.map((set) => (
              <button
                key={set.id}
                onClick={() => setSelectedSpinSetId(set.id)}
                style={{
                  padding: "10px 16px",
                  background:
                    selectedSpinSetId === set.id
                      ? "#007bff"
                      : "#f5f5f5",
                  color:
                    selectedSpinSetId === set.id ? "white" : "#333",
                  border:
                    selectedSpinSetId === set.id
                      ? "none"
                      : "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {set.is_default && (
                  <Star size={16} fill="currentColor" />
                )}
                {set.label ||
                  `Bộ spinner ${set.frames?.length || 0} frames`}
              </button>
            ))}
          </div>

          {selectedSpinSet && (
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                    }}
                  >
                    {selectedSpinSet.label || "Bộ spinner không tên"}
                    {selectedSpinSet.is_default && (
                      <span
                        style={{
                          marginLeft: "8px",
                          padding: "4px 8px",
                          background: "#ffc107",
                          color: "#000",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        Mặc định
                      </span>
                    )}
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    {selectedSpinSet.frames?.length || 0} frames
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {!selectedSpinSet.is_default && (
                    <button
                      onClick={() => {
                        updateSpinSetMutation.mutate({
                          spinSetId: selectedSpinSet.id,
                          data: { is_default: true },
                        });
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "#ffc107",
                        color: "#000",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Star size={16} />
                      Đặt làm mặc định
                    </button>
                  )}
                </div>
              </div>

              {selectedSpinSet.frames &&
                selectedSpinSet.frames.length > 0 && (
                  <div
                    style={{
                      marginBottom: "30px",
                      padding: "20px",
                      background: "#f9f9f9",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Spinner360
                      frames={selectedSpinSet.frames.map((frame) => ({
                        id: frame.id,
                        image_url: frame.image_url,
                        thumbnail_url: frame.thumbnail_url ?? undefined,
                        frame_index: frame.frame_index,
                      }))}
                      autoplay={false}
                      width={400}
                      height={400}
                    />
                  </div>
                )}

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                  }}
                >
                  Upload frames:
                </label>
                <input
                  type="file"
                  data-testid="spinner-frame-upload"
                  multiple
                  accept="image/*"
                  disabled={uploadingFrames || maxFramesReached}
                  onChange={(e) =>
                    handleUploadFrames(e, selectedSpinSet.id)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor:
                      uploadingFrames || maxFramesReached
                        ? "not-allowed"
                        : "pointer",
                  }}
                />
                {maxFramesReached && (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      fontSize: "14px",
                      color: "#dc3545",
                    }}
                  >
                    Đã đạt giới hạn {MAX_SPINNER_FRAMES} frames. Vui
                    lòng xóa bớt frame nếu muốn upload thêm.
                  </p>
                )}
                {uploadingFrames && (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      fontSize: "14px",
                      color: "#007bff",
                    }}
                  >
                    Đang upload frames...
                  </p>
                )}
              </div>

              {selectedSpinSet.frames &&
              selectedSpinSet.frames.length > 0 ? (
                <div>
                  <h4
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Frames ({selectedSpinSet.frames.length})
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {[...selectedSpinSet.frames]
                      .sort((a, b) => a.frame_index - b.frame_index)
                      .map((frame, index) => (
                        <div
                          key={frame.id}
                          style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "10px",
                            backgroundColor: "#fff",
                            position: "relative",
                          }}
                        >
                          <img
                            src={frame.thumbnail_url || frame.image_url}
                            alt={`Frame ${frame.frame_index + 1}`}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              marginBottom: "8px",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "8px",
                              textAlign: "center",
                            }}
                          >
                            Frame {frame.frame_index + 1}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{ display: "flex", gap: "4px" }}
                            >
                              <button
                                onClick={() =>
                                  handleMoveFrame(
                                    selectedSpinSet.id,
                                    frame.id,
                                    "up",
                                    spinSets,
                                  )
                                }
                                disabled={
                                  index === 0 ||
                                  reorderFramesMutation.isPending
                                }
                                style={{
                                  flex: 1,
                                  padding: "6px",
                                  background:
                                    index === 0 ? "#ccc" : "#f0f0f0",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor:
                                    index === 0
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize: "12px",
                                }}
                                title="Di chuyển lên"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() =>
                                  handleMoveFrame(
                                    selectedSpinSet.id,
                                    frame.id,
                                    "down",
                                    spinSets,
                                  )
                                }
                                disabled={
                                  index ===
                                    selectedSpinSet.frames.length - 1 ||
                                  reorderFramesMutation.isPending
                                }
                                style={{
                                  flex: 1,
                                  padding: "6px",
                                  background:
                                    index ===
                                    selectedSpinSet.frames.length - 1
                                      ? "#ccc"
                                      : "#f0f0f0",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor:
                                    index ===
                                    selectedSpinSet.frames.length - 1
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize: "12px",
                                }}
                                title="Di chuyển xuống"
                              >
                                ↓
                              </button>
                            </div>
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Bạn có chắc muốn xóa frame này?",
                                  )
                                ) {
                                  try {
                                    await deleteFrameMutation.mutateAsync(
                                      {
                                        spinSetId: selectedSpinSet.id,
                                        frameId: frame.id,
                                      },
                                    );
                                  } catch (error: unknown) {
                                    const err = error as {
                                      response?: { status?: number };
                                      status?: number;
                                      message?: string;
                                    };
                                    if (
                                      err?.response?.status === 404 ||
                                      err?.status === 404 ||
                                      err?.message?.includes(
                                        "not found",
                                      )
                                    ) {
                                      console.log(
                                        "Frame already deleted, refreshing...",
                                      );
                                      queryClient.invalidateQueries({
                                        queryKey: ["item", id],
                                      });
                                      return;
                                    }

                                    console.error(
                                      "Error deleting frame:",
                                      err,
                                    );
                                    alert(
                                      `Có lỗi khi xóa frame: ${err?.message || JSON.stringify(err)}`,
                                    );
                                  }
                                }
                              }}
                              disabled={deleteFrameMutation.isPending}
                              style={{
                                width: "100%",
                                padding: "6px",
                                background:
                                  deleteFrameMutation.isPending
                                    ? "#ccc"
                                    : "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: deleteFrameMutation.isPending
                                  ? "not-allowed"
                                  : "pointer",
                                fontSize: "12px",
                              }}
                            >
                              {deleteFrameMutation.isPending
                                ? "Xóa..."
                                : "Xóa"}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#666",
                    border: "1px dashed #ddd",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    Chưa có frames nào. Upload frames để bắt đầu.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#666",
            border: "1px dashed #ddd",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px" }}>
            Chưa có bộ spinner nào. Tạo bộ spinner mới để bắt đầu.
          </p>
        </div>
      )}
    </>
  );
}
