import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";

export const confirmToast = (message: string) =>
  new Promise<boolean>((resolve) => {
    toast(
      (t) => (
        <div className="bg-card border border-border rounded-xl p-5 shadow-lg max-w-md">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3 border-b pb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-primary" />
              </div>
              <h3 className=" text-base font-medium font-sans text-primary mb-1">
                Confirm Action
              </h3>
            </div>

            <p className="text-base text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors text-sm font-medium text-primary-foreground shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: "transparent",
          boxShadow: "none",
          padding: 0,
        },
      },
    );
  });
