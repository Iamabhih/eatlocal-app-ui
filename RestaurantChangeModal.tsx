import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCart } from "@/contexts/CartContext";

export function RestaurantChangeModal() {
  const {
    showRestaurantChangeModal,
    setShowRestaurantChangeModal,
    pendingItem,
    confirmRestaurantChange,
    items,
  } = useCart();

  const currentRestaurantName = items[0]?.restaurantName;
  const newRestaurantName = pendingItem?.restaurantName;

  return (
    <AlertDialog 
      open={showRestaurantChangeModal} 
      onOpenChange={setShowRestaurantChangeModal}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Switch restaurants?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your cart contains items from <strong>{currentRestaurantName}</strong>.
            </p>
            <p>
              Adding items from <strong>{newRestaurantName}</strong> will clear your current cart.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep current cart</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmRestaurantChange}
            className="bg-primary hover:bg-primary/90"
          >
            Start new order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
