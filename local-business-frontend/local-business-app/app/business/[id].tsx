import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import api from "../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Review = {
  _id: string;
  user: string | { name?: string };
  rating: number;
  text?: string;
  createdAt: string;
};

type Business = {
  _id: string;
  name: string;
  category: string;
  city: string;
  description?: string;
  address?: string;
  phone?: string;
  instagram?: string;
  images?: string[];
  avgRating?: number;
  reviewsCount?: number;
  reviews?: Review[];
  geo?: { coordinates: number[] };
};

type ChatMessage = {
  id: string;
  text: string;
  fromUser: boolean;
  time: string;
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "השכרת שמלות" : "Dress rental",
  "לייזר": "Laser",
  "גבות": "Eyebrowes",
  "אוכל ביתי": "Home food",
  "ספר": "Barber",
  "מורה פרטי": "Private Teacher",
  "קוסמטיקה": "Cosmetics",
  "איפור/עיצוב שיער": "Makeup/Hair Style",
  "אחר": "Other",
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
];

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      text: "שלום! איך אוכל לעזור לך? 😊",
      fromUser: false,
      time: "עכשיו",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const res = await api.get(`/businesses/${id}`);
      setBusiness(res.data);
    } catch (err) {
      console.log("FETCH BUSINESS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!business?.phone) return;
    const cleaned = business.phone.replace(/\D/g, "");
    const intl = cleaned.startsWith("0") ? "972" + cleaned.slice(1) : cleaned;
    Linking.openURL(`https://wa.me/${intl}?text=היי, ראיתי אתכם ב-Availo ורציתי לשאול...`);
  };

  const openInstagram = () => {
    if (!business?.instagram) return;
    const handle = business.instagram.replace("@", "");
    Linking.openURL(`https://instagram.com/${handle}`);
  };

  const openPhone = () => {
    if (!business?.phone) return;
    Linking.openURL(`tel:${business.phone}`);
  };

  const openMaps = () => {
    if (!business?.address) return;
    const query = encodeURIComponent(`${business.address}, ${business.city}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      fromUser: true,
      time: now,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
      // Auto reply
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "r",
          text: "תודה על פנייתך! נחזור אליך בהקדם 🙏",
          fromUser: false,
          time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 400);
  };

  const submitReview = async () => {
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      await api.post(`/businesses/${id}/reviews`, {
        rating: reviewRating,
        text: reviewText,
      });
      setReviewSent(true);
      fetchBusiness();
    } catch (err) {
      console.log("REVIEW ERROR:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 220],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1A1A2E" />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>העסק לא נמצא</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall}>
          <Text style={styles.backBtnSmallText}>חזרה</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImages =
    business.images && business.images.length > 0
      ? business.images
      : PLACEHOLDER_IMAGES;

  const emoji = CATEGORY_EMOJIS[business.category] ?? "🏪";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.floatingBackBtn}>
          <Text style={styles.floatingBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.floatingTitle} numberOfLines={1}>
          {business.name}
        </Text>
      </Animated.View>

      {/* Back button (always visible at top) */}
      <TouchableOpacity style={styles.absoluteBack} onPress={() => router.back()}>
        <Text style={styles.absoluteBackText}>‹</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setImageIndex(idx);
            }}
          >
            {displayImages.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {/* Dots */}
          <View style={styles.dotsRow}>
            {displayImages.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === imageIndex && styles.dotActive]}
              />
            ))}
          </View>
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {emoji} {business.category}
            </Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Name + rating row */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.cityText}>📍 {business.city}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingNumber}>
                {business.avgRating ? business.avgRating.toFixed(1) : "—"}
              </Text>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.reviewCount}>
                ({business.reviewsCount ?? 0})
              </Text>
            </View>
          </View>

          {/* Description */}
          {business.description ? (
            <Text style={styles.description}>{business.description}</Text>
          ) : null}

          {/* Address */}
          {business.address ? (
            <TouchableOpacity style={styles.addressRow} onPress={openMaps}>
              <Text style={styles.addressIcon}>🗺️</Text>
              <Text style={styles.addressText}>{business.address}</Text>
              <Text style={styles.addressArrow}>›</Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Contact Action Buttons ── */}
          <Text style={styles.sectionTitle}>צור קשר</Text>

          <View style={styles.contactGrid}>
            {/* Chat in-app */}
            <TouchableOpacity
              style={[styles.contactBtn, styles.contactBtnPrimary]}
              onPress={() => setChatOpen(true)}
            >
              <Text style={styles.contactBtnIcon}>💬</Text>
              <Text style={styles.contactBtnLabel}>שלח הודעה</Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            {business.phone ? (
              <TouchableOpacity
                style={[styles.contactBtn, styles.contactBtnWhatsapp]}
                onPress={openWhatsApp}
              >
                <Text style={styles.contactBtnIcon}>📱</Text>
                <Text style={styles.contactBtnLabelDark}>WhatsApp</Text>
              </TouchableOpacity>
            ) : null}

            {/* Instagram */}
            {business.instagram ? (
              <TouchableOpacity
                style={[styles.contactBtn, styles.contactBtnInstagram]}
                onPress={openInstagram}
              >
                <Text style={styles.contactBtnIcon}>📸</Text>
                <Text style={styles.contactBtnLabelDark}>אינסטגרם</Text>
              </TouchableOpacity>
            ) : null}

            {/* Phone */}
            {business.phone ? (
              <TouchableOpacity
                style={[styles.contactBtn, styles.contactBtnPhone]}
                onPress={openPhone}
              >
                <Text style={styles.contactBtnIcon}>📞</Text>
                <Text style={styles.contactBtnLabelDark}>התקשר</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Reviews ── */}
          <Text style={styles.sectionTitle}>ביקורות</Text>

          {business.reviews && business.reviews.length > 0 ? (
            business.reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {typeof review.user === "object" && review.user?.name
                        ? review.user.name[0].toUpperCase()
                        : "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUserName}>
                      {typeof review.user === "object" && review.user?.name
                        ? review.user.name
                        : "משתמש"}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString("he-IL")}
                    </Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {"★★★★★".split("").map((s, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.reviewStar,
                          i < review.rating ? styles.reviewStarActive : styles.reviewStarInactive,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                {review.text ? (
                  <Text style={styles.reviewText}>{review.text}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>אין ביקורות עדיין. היי הראשון! 🌟</Text>
          )}

          {/* ── Add Review ── */}
          {!reviewSent ? (
            <View style={styles.addReviewBox}>
              <Text style={styles.addReviewTitle}>השאר ביקורת</Text>
              <View style={styles.starsRow}>
                {"★★★★★".split("").map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setReviewRating(i + 1)}>
                    <Text
                      style={[
                        styles.starPicker,
                        i < reviewRating ? styles.starPickerActive : styles.starPickerInactive,
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="ספר לנו על החוויה שלך..."
                multiline
                numberOfLines={3}
                value={reviewText}
                onChangeText={setReviewText}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.submitReviewBtn,
                  reviewRating === 0 && styles.submitReviewBtnDisabled,
                ]}
                onPress={submitReview}
                disabled={reviewRating === 0 || reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>שלח ביקורת</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reviewSentBox}>
              <Text style={styles.reviewSentText}>✅ תודה! הביקורת נשלחה</Text>
            </View>
          )}

          <View style={{ height: 50 }} />
        </View>
      </Animated.ScrollView>

      {/* ── Chat Modal ── */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setChatOpen(false)} style={styles.chatCloseBtn}>
              <Text style={styles.chatCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.chatBusinessInfo}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>{emoji}</Text>
              </View>
              <View>
                <Text style={styles.chatBusinessName}>{business.name}</Text>
                <Text style={styles.chatOnline}>● מקוון</Text>
              </View>
            </View>
            {business.phone ? (
              <TouchableOpacity onPress={openWhatsApp} style={styles.chatWhatsappBtn}>
                <Text style={styles.chatWhatsappText}>📱 WA</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 56 }} />
            )}
          </View>

          {/* Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubbleRow,
                  msg.fromUser ? styles.messageBubbleRowRight : styles.messageBubbleRowLeft,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.fromUser ? styles.messageBubbleUser : styles.messageBubbleBusiness,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageBubbleText,
                      msg.fromUser ? styles.messageBubbleTextUser : styles.messageBubbleTextBusiness,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="כתוב הודעה..."
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.chatSendBtn, !chatInput.trim() && styles.chatSendBtnDisabled]}
              onPress={sendChatMessage}
              disabled={!chatInput.trim()}
            >
              <Text style={styles.chatSendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scroll: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 16,
  },
  backBtnSmall: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#111827",
    borderRadius: 12,
  },
  backBtnSmallText: {
    color: "#fff",
    fontSize: 16,
  },

  // Floating header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1A1A2E",
    flexDirection: "row",
    alignItems: "center",
  },
  floatingBackBtn: {
    marginRight: 12,
  },
  floatingBackArrow: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 32,
    marginTop: -4,
  },
  floatingTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  absoluteBack: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 16,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  absoluteBackText: {
    color: "#fff",
    fontSize: 26,
    lineHeight: 28,
    marginTop: -2,
  },

  // Gallery
  galleryContainer: {
    height: 300,
    backgroundColor: "#E5E7EB",
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  dotsRow: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
  },
  categoryBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    backgroundColor: "#FAFAFA",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  businessName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  cityText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  ratingBadge: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginLeft: 10,
    marginTop: 4,
  },
  ratingNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  ratingStar: {
    color: "#FBBF24",
    fontSize: 14,
  },
  reviewCount: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 8,
  },
  addressIcon: {
    fontSize: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  addressArrow: {
    fontSize: 20,
    color: "#9CA3AF",
  },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
    marginTop: 4,
  },

  // Contact grid
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    minWidth: "47%",
    flex: 1,
  },
  contactBtnPrimary: {
    backgroundColor: "#1A1A2E",
    width: "100%",
    flex: 0,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 2,
  },
  contactBtnWhatsapp: {
    backgroundColor: "#E7F8EE",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  contactBtnInstagram: {
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },
  contactBtnPhone: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  contactBtnIcon: {
    fontSize: 18,
  },
  contactBtnLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  contactBtnLabelDark: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },

  // Reviews
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  reviewStars: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  reviewStar: {
    fontSize: 14,
  },
  reviewStarActive: {
    color: "#FBBF24",
  },
  reviewStarInactive: {
    color: "#E5E7EB",
  },
  reviewText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
  },

  // Add Review
  addReviewBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  starPicker: {
    fontSize: 32,
  },
  starPickerActive: {
    color: "#FBBF24",
  },
  starPickerInactive: {
    color: "#E5E7EB",
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    marginBottom: 14,
    backgroundColor: "#FAFAFA",
  },
  submitReviewBtn: {
    backgroundColor: "#1A1A2E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitReviewBtnDisabled: {
    opacity: 0.4,
  },
  submitReviewBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  reviewSentBox: {
    backgroundColor: "#D1FAE5",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  reviewSentText: {
    fontSize: 15,
    color: "#065F46",
    fontWeight: "600",
  },

  // Chat Modal
  chatModal: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  chatHeader: {
    backgroundColor: "#1A1A2E",
    paddingTop: Platform.OS === "ios" ? 20 : 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  chatCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatCloseText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  chatBusinessInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatAvatarText: {
    fontSize: 20,
  },
  chatBusinessName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  chatOnline: {
    color: "#6EE7B7",
    fontSize: 12,
    marginTop: 1,
  },
  chatWhatsappBtn: {
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatWhatsappText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    gap: 10,
  },
  messageBubbleRow: {
    flexDirection: "row",
  },
  messageBubbleRowLeft: {
    justifyContent: "flex-start",
  },
  messageBubbleRowRight: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleUser: {
    backgroundColor: "#1A1A2E",
    borderBottomRightRadius: 4,
  },
  messageBubbleBusiness: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  messageBubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageBubbleTextUser: {
    color: "#fff",
  },
  messageBubbleTextBusiness: {
    color: "#111827",
  },
  messageTime: {
    fontSize: 10,
    color: "rgba(150,150,150,0.7)",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  chatInputRow: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  chatTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },
  chatSendBtn: {
    backgroundColor: "#1A1A2E",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendBtnDisabled: {
    opacity: 0.4,
  },
  chatSendIcon: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 2,
  },
});
