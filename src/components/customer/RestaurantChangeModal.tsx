import { useEffect, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const { items } = useCart();

  useEffect(() => {
    // Listen for custom event when user tries to add item from different restaurant
    const handleRestaurantChange = (event: CustomEvent) => {
      setPendingAction(() => event.detail.action);
      setIsOpen(true);
    };

    window.addEventListener(
      "restaurant-change-warning" as any,
      handleRestaurantChange
    );

    return () => {
      window.removeEventListener(
        "restaurant-change-warning" as any,
        handleRestaurantChange
      );
    };
  }, []);

  const handleConfirm = () => {
    if (pendingAction) {
      pendingAction();
    }
    setIsOpen(false);
    setPendingAction(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPendingAction(null);
  };

  if (items.length === 0) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Restaurant?</AlertDialogTitle>
          <AlertDialogDescription>
            Your cart contains items from {items[0]?.restaurantName}. Adding
            items from a different restaurant will clear your current cart.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Clear Cart & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
