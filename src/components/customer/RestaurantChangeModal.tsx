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
import { useCart } from "@/hooks/useCart";

export function RestaurantChangeModal() {
  const {
    items,
    restaurantName,
    showRestaurantChangeModal,
    setShowRestaurantChangeModal,
    confirmRestaurantChange,
    pendingItem,
  } = useCart();

  const handleConfirm = () => {
    confirmRestaurantChange();
  };

  const handleCancel = () => {
    setShowRestaurantChangeModal(false);
  };

  const currentRestaurant = items.length > 0 ? restaurantName : null;
  const newRestaurant = pendingItem?.restaurantName;

  return (
    <AlertDialog open={showRestaurantChangeModal} onOpenChange={setShowRestaurantChangeModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Restaurant?</AlertDialogTitle>
          <AlertDialogDescription>
            Your cart contains items from <span className="font-semibold">{currentRestaurant}</span>.
            Adding items from <span className="font-semibold">{newRestaurant}</span> will clear your current cart.
            <br /><br />
            Do you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            Clear Cart & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
