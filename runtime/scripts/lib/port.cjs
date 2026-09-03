/**
 * Refuse to run against somebody else's server.
 *
 * A browser proof spawns its own runtime on a fixed port, waits for
 * `/api/lessons` to answer, and starts driving. If a server from an earlier
 * run is still holding that port, the spawn dies instantly with EADDRINUSE
 * onto a stdout nobody reads, `/api/lessons` answers anyway — and the whole
 * proof runs against stale code while reporting PASS. That happened here: a
 * transport repair looked like it had no effect for four consecutive runs
 * because the zombie under test predated it.
 *
 * A test that silently validates code that is not the code you changed is
 * worse than a test that fails, so this fails, loudly, with the way out.
 */
const net = require("net");

function assertPortFree(port, label) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (err) => {
      probe.close();
      if (err && err.code === "EADDRINUSE") {
        reject(
          new Error(
            `port ${port} is already held by another process, so ${label} would have run against a server it did not build.\n` +
              `Clear it first:  ps -eo pid,args | grep '[d]ist/server/index.js'   then kill the stragglers.`,
          ),
        );
        return;
      }
      reject(err);
    });
    probe.once("listening", () => probe.close(() => resolve()));
    probe.listen(port, "127.0.0.1");
  });
}

module.exports = { assertPortFree };
