import FlyerMaker from "@/components/FlyerMaker";

export default function Home() {
  return (
    <main className="min-h-dvh px-2 py-2 sm:px-5 sm:py-4 md:h-dvh md:overflow-hidden lg:px-6">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-3 md:gap-4">
        <header className="shrink-0 text-center sm:text-left">
          <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            NCCS Flyer
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 sm:text-base sm:leading-6">
            Choose a flyer template, upload your photo, remove the background, add your text, and
            download your final flyer.
          </p>
        </header>
        <FlyerMaker />
      </div>
    </main>
  );
}
