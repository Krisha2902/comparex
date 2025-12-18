export function getBotReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes("price")) {
    return "You can compare prices of products across different platforms on ValueVue.";
  }

  if (msg.includes("compare")) {
    return "Search any product and we will show you prices from multiple retailers.";
  }

  if (msg.includes("wishlist")) {
    return "You can save products to your wishlist and track price drops.";
  }

  if (msg.includes("electronics")) {
    return "Electronics include mobiles, laptops, TVs and more.";
  }

  return "I'm here to help! Try asking about product prices, comparisons, or categories.";
}
