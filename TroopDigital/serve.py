#!/usr/bin/env python3
"""Local preview server for the homepage.

Usage:  python3 serve.py [port]      (default 8000)  ->  http://localhost:8000

Same as `python3 -m http.server`, but tells the browser never to cache files,
so edits to CSS/JS show up on a normal reload instead of a stale copy.
"""
import functools
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(NoCacheHandler, directory=root)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Serving {root}\nOpen http://localhost:{port}  (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
