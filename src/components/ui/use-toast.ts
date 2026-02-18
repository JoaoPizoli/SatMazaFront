// Minimal useToast implementation to avoid crashes
export type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive"
}

export function useToast() {
    function toast(props: ToastProps) {
        // In a real implementation this would trigger a toast component
        console.log("Toast:", props)
        if (props.variant === "destructive") {
            console.error(props.title, props.description);
        } else {
            console.info(props.title, props.description);
        }
        // Simplistic alert for critical errors if specific component is missing
        if (props.variant === "destructive") {
            alert(`${props.title}: ${props.description}`);
        }
    }

    return { toast }
}
