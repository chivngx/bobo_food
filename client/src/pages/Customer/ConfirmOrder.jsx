// File: src/pages/Customer/ConfirmOrder.jsx (Phiên bản đã sửa tính phí ship)

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BackArrow from "../../components/shared/BackArrow";
import LocationIcon from "../../components/shared/LocationIcon";
import ClockIcon2 from "../../components/shared/ClockIcon2";
import PaymentIcon from "../../components/shared/PaymentIcon";
import TagIcon from "../../components/shared/TagIcon";
import CardIcon from "../../components/shared/CardIcon";
import PlusIcon from "../../components/shared/PlusIcon";
import MinusIcon from "../../components/shared/MinusIcon";
import AddressSelector from "../../components/role-specific/Customer/AddressSelector";
import axios from "axios";
import { useOrder } from "../../contexts/OrderContext";
import { useAddress } from "../../contexts/AddressContext";

// --- Styles cho Modal ---
const modalStyles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  content: {
    background: "white",
    padding: "2.5rem 2rem",
    borderRadius: "1.6rem",
    width: "85vw",
    maxWidth: "340px",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
  },
  text: {
    fontSize: "1.5rem",
    color: "#1A1A1A",
    marginBottom: "2rem",
    lineHeight: 1.5,
    fontWeight: "500",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
  },
  button: {
    padding: "1.2rem 0",
    flex: 1,
    borderRadius: "12px",
    border: "none",
    fontSize: "1.4rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  buttonCancel: {
    border: "2px solid #E0E0E0",
    background: "white",
    color: "#666",
  },
  buttonConfirm: {
    background: "linear-gradient(90deg, #FE5621 0%, #EE4D2D 100%)",
    color: "white",
    boxShadow: "0 4px 12px rgba(254, 86, 33, 0.3)",
  },
};
// --- Hết Styles Modal ---

// Format tiền
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

// 📍 Tính khoảng cách giữa 2 tọa độ theo Haversine (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function ConfirmOrder() {
  const navigate = useNavigate();
  const location = useLocation();

  const savedData = JSON.parse(localStorage.getItem("checkoutData") || "{}");
  const initialState = location.state || savedData;

  const [cartItems, setCartItems] = useState(initialState.cartItems || []);
  const [total, setTotal] = useState(initialState.total || 0);
  const { shop_id, shop_name = "Cửa hàng chưa xác định" } = initialState;

  const [modalVisible, setModalVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);
  const { currentAddress, setCurrentAddress } = useAddress();
  const [note, setNote] = useState("");
  const { paymentMethodName, setPaymentMethodName } = useOrder();
  const [couponCount] = useState(0);

  // =============================
  // ✅ PHẦN ĐÃ SỬA: Khoảng cách & phí ship
  // =============================
  const [deliveryDistance, setDeliveryDistance] = useState(
    initialState.distance || null
  );

  const distanceKm =
    deliveryDistance ?? initialState.distance ?? 0;

  const shippingFee =
    distanceKm > 0
      ? Math.round(10000 + distanceKm * 5000)
      : 15000;
  // =============================
  // END sửa
  // =============================

  const foodDiscount = 0;
  const shippingDiscount = 0;

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalItemPrice = total;

  const totalPrice =
    totalItemPrice + shippingFee - foodDiscount - shippingDiscount;

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);

  const [canDeliver, setCanDeliver] = useState(true);
  const [distanceError, setDistanceError] = useState(null);

  const contactInfo =
    currentUser?.full_name && currentUser?.phone
      ? `${currentUser.full_name} | ${currentUser.phone}`
      : "Chưa có thông tin liên hệ";

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/me", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setCurrentUser(data.user);
        else navigate("/login");
      } catch {
        navigate("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!loadingUser && currentUser && !currentUser.phone) {
      alert("Vui lòng cập nhật số điện thoại trước khi đặt hàng");
      navigate("/customer/profile");
    }
  }, [currentUser]);

  // Fetch shop info
  useEffect(() => {
    if (!shop_id) return;
    axios
      .get(`http://localhost:5000/api/shops/${shop_id}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data?.success) setShopInfo(res.data.data);
      })
      .catch(console.error);
  }, [shop_id]);

  // Check distance real-time
  useEffect(() => {
    if (!shopInfo?.address?.lat_lon || !currentAddress?.lat_lon) return;

    const shopLat = Number(shopInfo.address.lat_lon.lat);
    const shopLon = Number(shopInfo.address.lat_lon.lon);
    const userLat = Number(currentAddress.lat_lon.lat);
    const userLon = Number(currentAddress.lat_lon.lon);

    const dist = calculateDistance(shopLat, shopLon, userLat, userLon);

    setDeliveryDistance(dist);

    if (dist > 5) {
      setCanDeliver(false);
      setDistanceError(
        `Khoảng cách giao hàng quá xa (${dist.toFixed(
          1
        )}km). Chỉ hỗ trợ trong bán kính 5km.`
      );
    } else {
      setCanDeliver(true);
      setDistanceError(null);
    }
  }, [shopInfo, currentAddress]);

  const formatAddress = (addr) => {
    if (!addr?.address_line) return "Chưa có địa chỉ giao hàng";
    const { detail, ward, province } = addr.address_line;
    return `${detail}, ${ward}, ${province}`;
  };

  const handleSelectAddress = (address) => {
    setCurrentAddress(address);
    setAddressSelectorOpen(false);
  };

  // Cập nhật localStorage
  const updateTotalsAndLocalStorage = (items) => {
    const newTotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    setTotal(newTotal);

    localStorage.setItem(
      "checkoutData",
      JSON.stringify({
        cartItems: items,
        total: newTotal,
        shop_id,
        shop_name,
        distance: deliveryDistance,
      })
    );
  };

  const handleQuantityChange = async (itemId, change) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) return;

    try {
      const res = await fetch(`http://localhost:5000/api/cart/items`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          quantity: newQuantity,
        }),
      });

      if (!res.ok) throw new Error("Không thể cập nhật số lượng.");

      const updatedItems = cartItems.map((i) =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      );

      setCartItems(updatedItems);
      updateTotalsAndLocalStorage(updatedItems);
    } catch (err) {
      alert("Đã xảy ra lỗi khi cập nhật số lượng!");
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cart/items`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (!res.ok) throw new Error("Không thể xóa sản phẩm.");

      const updatedItems = cartItems.filter((i) => i.id !== itemId);
      setCartItems(updatedItems);
      updateTotalsAndLocalStorage(updatedItems);
    } catch (err) {
      alert("Đã xảy ra lỗi khi xóa món hàng!");
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) handleRemoveItem(itemToRemove);
    setModalVisible(false);
    setItemToRemove(null);
  };

  const handleCancelRemove = () => {
    setModalVisible(false);
    setItemToRemove(null);
  };

  if (!cartItems.length)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <p style={{ fontSize: "1.2rem", color: "#555" }}>Giỏ hàng trống</p>
        <button
          onClick={() => navigate("/customer/discover")}
          style={{
            background: "#FE5621",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            fontSize: "1rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Khám phá món ăn
        </button>
      </div>
    );

  if (loadingUser)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p style={{ fontSize: "1.2rem", color: "#555" }}>Đang tải...</p>
      </div>
    );

  const handleConfirmOrder = async () => {
    const orderCode = Date.now();

    if (!currentUser?.phone) {
      alert("Vui lòng cập nhật số điện thoại trước khi đặt hàng");
      navigate("/customer/profile");
      return;
    }

    if (!canDeliver) {
      alert(distanceError);
      return;
    }

    if (!currentAddress?.lat_lon?.lat || !currentAddress?.lat_lon?.lon) {
      alert("Địa chỉ giao hàng chưa có tọa độ.");
      return;
    }

    if (paymentMethodName === "Chuyển khoản") {
      try {
        const res = await fetch("http://localhost:5000/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderCode,
            amount: totalPrice,
            description: `DH ${orderCode}`.slice(0, 25),
            metadata: {
              user_id: currentUser?.id,
              shop_id,
              address_id: currentAddress?.address_id,
              delivery_address: currentAddress,
              items: cartItems,
            },
          }),
        });

        const data = await res.json();
        if (data.success) window.location.href = data.paymentUrl;
        else alert("Không thể tạo link thanh toán!");
      } catch {
        alert("Lỗi khi gọi PayOS!");
      }
    } else {
      // CASH ORDER
      try {
        const res = await fetch(
          "http://localhost:5000/api/orders/create-cash",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: currentUser?.id,
              shop_id,
              note,
              address_id: currentAddress?.address_id,
              delivery_address: JSON.stringify(currentAddress),
              items: cartItems,
            }),
          }
        );

        const data = await res.json();
        if (data.success) {
          for (const item of cartItems) {
            await fetch(`http://localhost:5000/api/cart/items`, {
              method: "DELETE",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId: item.id }),
            });
          }

          navigate("/customer/order-success", {
            state: {
              shop_id,
              shop_name,
              totalPrice,
              paymentMethod: paymentMethodName,
              order_id: data.order?.id,
            },
          });
        } else alert("Không thể tạo đơn hàng!");
      } catch {
        alert("Lỗi khi tạo đơn hàng!");
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FAFAFA",
        minHeight: "100vh",
        paddingTop: "8.5vh",
        paddingBottom: "13.875vh",
      }}
    >
      {/* Modal */}
      {modalVisible && (
        <div style={modalStyles.backdrop}>
          <div style={modalStyles.content}>
            <p style={modalStyles.text}>
              Bạn có muốn xóa sản phẩm khỏi đơn hàng?
            </p>
            <div style={modalStyles.buttonContainer}>
              <button
                onClick={handleCancelRemove}
                style={{ ...modalStyles.button, ...modalStyles.buttonCancel }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRemove}
                style={{ ...modalStyles.button, ...modalStyles.buttonConfirm }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          width: "100%",
          height: "8.5vh",
          background: "white",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <BackArrow
          style={{
            position: "absolute",
            top: "50%",
            left: "4.17vw",
            transform: "translateY(-50%)",
            cursor: "pointer",
          }}
          onClick={() => navigate("/customer/cart")}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{ color: "#1A1A1A", fontSize: "1.7rem", fontWeight: 700 }}
          >
            Thanh toán
          </div>
          <div
            style={{
              color: "#666",
              fontSize: "1.2rem",
              fontWeight: 500,
              marginTop: "0.2rem",
            }}
          >
            {shop_name}
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      <div
        style={{
          background: "white",
          borderRadius: "1.6rem",
          margin: "2.5vh auto",
          padding: "1.5rem",
          width: "91.67vw",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <LocationIcon style={{ marginTop: "0.2rem" }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.4rem",
                color: "#1A1A1A",
                marginBottom: "0.5rem",
              }}
            >
              {formatAddress(currentAddress)}
            </div>
            <div style={{ color: "#888", fontSize: "1.2rem" }}>
              {contactInfo}
            </div>
          </div>
          <div
            onClick={() => setAddressSelectorOpen(true)}
            style={{
              color: "#FE5621",
              fontWeight: 700,
              fontSize: "1.3rem",
              cursor: "pointer",
            }}
          >
            Sửa
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            marginTop: "1.2rem",
            paddingTop: "1.2rem",
            borderTop: "1px solid #F5F5F5",
            color: "#666",
            fontSize: "1.3rem",
          }}
        >
          <ClockIcon2 />
          <span>
            Giao nhanh{" "}
            {deliveryDistance !== null &&
              ` • ${deliveryDistance.toFixed(1)}km`}
          </span>
        </div>

        {!canDeliver && distanceError && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#FEF3F2",
              border: "1px solid #FEE4E2",
              borderRadius: "8px",
              display: "flex",
              gap: "0.8rem",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>⚠️</span>
            <div>
              <div
                style={{
                  color: "#B42318",
                  fontSize: "1.3rem",
                  fontWeight: "600",
                }}
              >
                Không thể giao hàng
              </div>
              <div
                style={{
                  color: "#B42318",
                  fontSize: "1.2rem",
                }}
              >
                {distanceError}
              </div>
            </div>
          </div>
        )}
      </div>

      <AddressSelector
        isOpen={addressSelectorOpen}
        onClose={() => setAddressSelectorOpen(false)}
        onSelectAddress={handleSelectAddress}
        currentAddress={currentAddress}
      />

      {/* Danh sách món */}
      <div
        style={{
          background: "white",
          borderRadius: "1.6rem",
          margin: "2.5vh auto",
          width: "91.67vw",
          paddingBottom: "1rem",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "1.5rem 1.5rem 1rem",
          }}
        >
          <div
            style={{
              color: "#1A1A1A",
              fontSize: "1.5rem",
              fontWeight: "700",
            }}
          >
            Tóm tắt đơn
          </div>

          <div
            style={{
              color: "#FE5621",
              fontSize: "1.3rem",
              fontWeight: "700",
              cursor: "pointer",
            }}
            onClick={() =>
              navigate("/customer/restaurant-details", {
                state: { shop_id },
              })
            }
          >
            + Thêm món
          </div>
        </div>

        {cartItems.map((item) => {
          const handleDecreaseClick = () => {
            if (item.quantity === 1) {
              setItemToRemove(item.id);
              setModalVisible(true);
            } else handleQuantityChange(item.id, -1);
          };

          const handleIncreaseClick = () => {
            handleQuantityChange(item.id, 1);
          };

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "1.2rem 1.5rem",
                borderBottom:
                  cartItems[cartItems.length - 1].id !== item.id
                    ? "1px solid #F5F5F5"
                    : "none",
              }}
            >
              <img
                src={item.product_image || "/default-food.jpg"}
                alt={item.product_name}
                style={{
                  width: "5.5rem",
                  height: "5.5rem",
                  borderRadius: "1.2rem",
                  objectFit: "cover",
                  marginRight: "1rem",
                }}
              />

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    color: "#1A1A1A",
                    fontSize: "1.4rem",
                    fontWeight: "700",
                  }}
                >
                  {item.product_name}
                </div>
                <div
                  style={{
                    color: "#FE5621",
                    fontSize: "1.4rem",
                    fontWeight: "700",
                  }}
                >
                  {formatPrice(item.unit_price)}
                </div>
              </div>

              <div
                style={{
                  minWidth: "90px",
                  height: "36px",
                  borderRadius: "12px",
                  border: "2px solid #FE5621",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 0.8rem",
                }}
              >
                <MinusIcon
                  style={{ cursor: "pointer" }}
                  onClick={handleDecreaseClick}
                />

                <span
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: "700",
                    color: "#1A1A1A",
                  }}
                >
                  {item.quantity}
                </span>

                <PlusIcon
                  style={{ cursor: "pointer" }}
                  onClick={handleIncreaseClick}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* PAYMENT METHOD */}
      <div
        style={{
          background: "white",
          borderRadius: "1.6rem",
          margin: "2.5vh auto",
          width: "91.67vw",
          padding: "1.5rem",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          cursor: "pointer",
        }}
        onClick={() => navigate("/customer/payment-method")}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {paymentMethodName === "Chuyển khoản" ? (
              <CardIcon />
            ) : (
              <PaymentIcon />
            )}
            <div>
              <div
                style={{
                  color: "#1A1A1A",
                  fontSize: "1.4rem",
                  fontWeight: "700",
                }}
              >
                {paymentMethodName || "Tiền mặt"}
              </div>
              <div
                style={{
                  color: "#666",
                  fontSize: "1.2rem",
                  marginTop: "0.3rem",
                }}
              >
                {paymentMethodName === "Chuyển khoản"
                  ? "Thanh toán bằng cách quét mã QR"
                  : "Thanh toán bằng tiền mặt khi nhận hàng"}
              </div>
            </div>
          </div>
          <div
            style={{
              color: "#FE5621",
              fontSize: "1.3rem",
              fontWeight: "700",
            }}
          >
            Sửa
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      <div
        style={{
          background: "white",
          borderRadius: "1.6rem",
          margin: "2.5vh auto",
          width: "91.67vw",
          padding: "1.5rem",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            color: "#1A1A1A",
            fontSize: "1.4rem",
            fontWeight: "700",
            marginBottom: "1rem",
          }}
        >
          Ghi chú cho người bán
        </div>
        <textarea
          placeholder="Nhập ghi chú (nếu có)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "1rem",
            fontSize: "1.3rem",
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* PAYMENT DETAILS */}
      <div
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "2.5vh",
          width: "91.67vw",
          background: "white",
          borderRadius: "1.6rem",
          padding: "2rem 1.5rem",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            color: "#1A1A1A",
            fontSize: "1.5rem",
            fontWeight: "700",
            marginBottom: "1.5rem",
          }}
        >
          Chi tiết thanh toán
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1.2rem",
          }}
        >
          <div style={{ color: "#666", fontSize: "1.3rem" }}>
            Tổng giá món ({totalQuantity} món)
          </div>
          <div
            style={{ color: "#1A1A1A", fontSize: "1.3rem", fontWeight: 600 }}
          >
            {formatPrice(totalItemPrice)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1.2rem",
          }}
        >
          <div style={{ color: "#666", fontSize: "1.3rem" }}>Phí giao hàng</div>
          <div
            style={{ color: "#1A1A1A", fontSize: "1.3rem", fontWeight: 600 }}
          >
            {formatPrice(shippingFee)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "1rem",
            borderTop: "2px dashed #F0F0F0",
          }}
        >
          <div
            style={{
              color: "#1A1A1A",
              fontSize: "1.5rem",
              fontWeight: "700",
            }}
          >
            Tổng thanh toán
          </div>
          <div
            style={{
              color: "#FE5621",
              fontSize: "1.7rem",
              fontWeight: "700",
            }}
          >
            {formatPrice(totalPrice)}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          width: "100%",
          background: "white",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
          borderTopLeftRadius: "2rem",
          borderTopRightRadius: "2rem",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "1.5rem 0",
        }}
      >
        <div
          style={{
            width: "87.78vw",
            margin: "0 auto",
            padding: "1.4rem",
            background: canDeliver
              ? "linear-gradient(90deg, #FE5621 0%, #EE4D2D 100%)"
              : "#CCCCCC",
            borderRadius: "12px",
            cursor: canDeliver ? "pointer" : "not-allowed",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: canDeliver ? 1 : 0.6,
          }}
          onClick={canDeliver ? handleConfirmOrder : undefined}
        >
          <div style={{ color: "white", fontSize: "1.6rem", fontWeight: 700 }}>
            {canDeliver ? "Đặt đơn" : "Không thể giao hàng"}
          </div>
          <div style={{ color: "white", fontSize: "1.6rem", fontWeight: 700 }}>
            {canDeliver && formatPrice(totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}
