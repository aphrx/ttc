export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-center text-neutral-800">
      <div className="max-w-2xl space-y-4 px-6 text-lg">
        <p>
          To view live arrivals for your stop, visit{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-base">
            ttc.amalparames.dev/stop/&lt;id&gt;
          </code>
          .
        </p>
        <p>
          The stop ID is printed on the pole or shelter. Replace{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-base">
            &lt;id&gt;
          </code>{" "}
          with that number to load the schedule for your location.
        </p>
      </div>
    </main>
  );
}
