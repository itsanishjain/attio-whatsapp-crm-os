import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
// import { Toaster } from "@/components/ui/sonner"
// import { type QueryClient } from "@tanstack/react-query";
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'

type MyRouterContext = Record<string, never>;

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});

function Root() {
  return (
    <>
      <hr />
      <div className="p-2 max-w-7xl m-auto">
        <Outlet />
      </div>
      {/* <Toaster /> */}
      {/* <TanStackRouterDevtools /> */}
    </>
  );
}
