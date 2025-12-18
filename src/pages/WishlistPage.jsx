import Navbar from "../components/Navbar";
import WishlistCard from "../components/WishlistCard";
import EmptyWishlist from "../components/EmptyWishlist";
import { wishlistItems } from "../data/wishlistData";

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-[#f3f9fd]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-blue-600 mb-6">
          My Wishlist
        </h1>

        {wishlistItems.length === 0 ? (
          <EmptyWishlist />
        ) : (
         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistItems.map((item) => (
              <WishlistCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
