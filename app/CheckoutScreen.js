import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

export default function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  // Sample cart data
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      name: 'Neckless',
      desc: 'Rose Gold Pearl Dangle Earrings Tanique',
      price: 45.96,
      quantity: 1,
      image: 'https://.../necklace.jpg',
    },
    {
      id: '2',
      name: 'Neckless',
      desc: 'Rose Gold Pearl Dangle Earrings Tanique',
      price: 45.96,
      quantity: 1,
      image: 'https://.../bracelet.jpg',
    },
  ]);

  const updateQty = (id, delta) => {
    setCartItems(items =>
      items.map(i =>
        i.id === id
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  };

  const subTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = 30;
  const total = subTotal - discount;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.pageTitle}>Checkout</Text>

      <View style={[styles.mainRow, isWide && styles.wideRow]}>
        {/* Left: Product List */}
        <View style={[styles.cartBox, isWide && styles.flex2]}>
          <View style={styles.cartHeaderRow}>
            {['Product', 'Price', 'Qty', 'Total'].map(text => (
              <Text key={text} style={styles.headerText}>{text}</Text>
            ))}
          </View>
          {cartItems.map(item => (
            <View key={item.id} style={styles.cartItemRow}>
              <View style={styles.productInfo}>
                <Image source={{ uri: item.image }} style={styles.productImg} />
                <View>
                  <Text style={styles.prodName}>{item.name}</Text>
                  <Text style={styles.prodDesc}>{item.desc}</Text>
                </View>
              </View>
              <Text style={styles.cellCenter}>${item.price.toFixed(2)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQty(item.id, -1)}>
                  <Text style={styles.qtyBtn}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQty(item.id, 1)}>
                  <Text style={styles.qtyBtn}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cellCenter}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Right: Cart Summary */}
        <View style={[styles.summaryBox, isWide && styles.flex1]}>
          <Text style={styles.summaryTitle}>Cart Total</Text>
          {[
            ['Sub - Total', `$${subTotal.toFixed(2)}`],
            ['Discount', `$${discount.toFixed(2)}`],
            ['Tax', '$0.00'],
            ['Delivery Charge', '$0.00'],
          ].map(([label, value]) => (
            <View key={label} style={styles.summaryRow}>
              <Text>{label}</Text>
              <Text>{value}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalText}>Total Amount</Text>
            <Text style={styles.summaryTotalText}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.payBtn}>
            <Text style={styles.payBtnText}>Payment →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Below: Billing Form */}
      <View style={styles.billingBox}>
        <Text style={styles.billingTitle}>Billing Details</Text>
        {[
          ['Name*', 'Company Name'],
          ['Phone*', 'Email*'],
        ].map((row, idx) => (
          <View key={idx} style={styles.rowInputs}>
            {row.map(pl => (
              <TextInput key={pl} placeholder={pl} style={styles.input} />
            ))}
          </View>
        ))}
        <TextInput placeholder="Address*" style={styles.fullInput} />
        <View style={styles.rowInputs}>
          <TextInput placeholder="City*" style={styles.input} />
          <TextInput placeholder="Postal Code*" style={styles.input} />
        </View>
        <View style={styles.rowInputs}>
          <TextInput placeholder="State" style={styles.input} />
          <TextInput placeholder="Country" style={styles.input} />
        </View>
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Submit →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: '#FAF7EF',
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'serif',
    color: '#C9A557',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  mainRow: {
    flexDirection: 'column',
    gap: 16,
  },
  wideRow: {
    flexDirection: 'row',
    gap: 24,
  },
  flex2: { flex: 2 },
  flex1: { flex: 1 },

  cartBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#C9A557',
    marginLeft: 96,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  productImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  prodName: {
    fontWeight: 'bold',
  },
  prodDesc: {
    fontSize: 12,
    color: '#555',
  },
  cellCenter: {
    flex: 1,
    textAlign: 'center',
  },
  qtyRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtn: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  qtyValue: {
    width: 24,
    textAlign: 'center',
    fontSize: 16,
  },

  summaryBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderColor: '#CCC',
    marginTop: 8,
    paddingTop: 8,
  },
  summaryTotalText: {
    fontWeight: 'bold',
  },
  payBtn: {
    marginTop: 16,
    backgroundColor: '#C9A557',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  billingBox: {
    marginTop: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  billingTitle: {
    fontSize: 20,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#C9A557',
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAF7EF',
    padding: 10,
    borderRadius: 4,
  },
  fullInput: {
    backgroundColor: '#FAF7EF',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    backgroundColor: '#C9A557',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
