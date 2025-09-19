#!/usr/bin/env python3
import argparse, json, re, sys

def get_deltas(profile):
    # Prefer timeDeltas (µs). Fallback to timestamps (µs) or samplingInterval.
    if "timeDeltas" in profile and profile["timeDeltas"]:
        return profile["timeDeltas"], 1e-3  # µs -> ms
    if "timestamps" in profile and profile["timestamps"]:
        ts = profile["timestamps"]
        deltas = [0] + [ts[i] - ts[i-1] for i in range(1, len(ts))]
        return deltas, 1e-3
    # Try samplingInterval (µs) or sampleInterval (µs)
    interval = profile.get("samplingInterval") or profile.get("sampleInterval") or 1000
    return [interval] * len(profile.get("samples", [])), 1e-3

def build_parents(nodes):
    parents = {}
    for n in nodes:
        for c in n.get("children", []):
            parents[c] = n["id"]
    return parents

def matcher(pattern, file_substr, ignore_case):
    flags = re.I if ignore_case else 0
    rx = re.compile(pattern, flags)
    file_rx = re.compile(file_substr, flags) if file_substr else None

    def _match(node):
        cf = node.get("callFrame", {})
        if not rx.search(cf.get("functionName", "") or ""):
            return False
        if file_rx:
            return bool(file_rx.search(cf.get("url", "") or ""))
        return True
    return _match

def main():
    ap = argparse.ArgumentParser(description="Extract function time from .cpuprofile")
    ap.add_argument("cpuprofile", help=".cpuprofile JSON file")
    ap.add_argument("--func", required=True, help="Function name regex (e.g. '^myFunc$')")
    ap.add_argument("--file", default=None, help="Optional file/url regex filter (e.g. 'src/foo.ts')")
    ap.add_argument("--ignore-case", type=int, default=1, help="1=case-insensitive (default), 0=case-sensitive")
    ap.add_argument("--list-matches", action="store_true", help="List matched frames and exit")
    args = ap.parse_args()

    with open(args.cpuprofile, "r", encoding="utf-8") as f:
        profile = json.load(f)

    nodes = profile.get("nodes") or profile.get("profile", {}).get("nodes")
    samples = profile.get("samples") or profile.get("profile", {}).get("samples")
    if not nodes or not samples:
        print("Invalid .cpuprofile: missing nodes/samples", file=sys.stderr)
        sys.exit(2)

    id2node = {n["id"]: n for n in nodes}
    parents = build_parents(nodes)
    deltas, scale = get_deltas(profile)
    if len(deltas) != len(samples):
        # Clamp to min length
        m = min(len(deltas), len(samples))
        deltas, samples = deltas[:m], samples[:m]

    match = matcher(args.func, args.file, bool(args.ignore_case))
    matched_ids = {n["id"] for n in nodes if match(n)}

    if args.list_matches:
        for nid in sorted(matched_ids):
            cf = id2node[nid].get("callFrame", {})
            print(f"id={nid} fn={cf.get('functionName')} file={cf.get('url')}:{cf.get('lineNumber')}:{cf.get('columnNumber')}")
        sys.exit(0)

    total_us = sum(deltas)
    self_us = 0
    incl_us = 0
    self_samples = 0
    incl_samples = 0

    for nid, dt in zip(samples, deltas):
        # inclusive: if any frame in stack matches
        cur = nid
        seen = False
        while cur in id2node:
            if cur in matched_ids:
                incl_us += dt
                incl_samples += 1
                seen = True
                break
            cur = parents.get(cur)
            if cur is None:
                break
        # self: leaf is the function
        if nid in matched_ids:
            self_us += dt
            self_samples += 1

    total_ms = total_us * scale
    self_ms = self_us * scale
    incl_ms = incl_us * scale
    pct = lambda x: (x / total_ms * 100.0) if total_ms else 0.0

    print(f"Function pattern: {args.func}  File filter: {args.file or '(any)'}")
    print(f"Total sampled time: {total_ms:.2f} ms")
    print(f"Inclusive time:     {incl_ms:.2f} ms  ({pct(incl_ms):.2f}%)  samples={incl_samples}")
    print(f"Self time:          {self_ms:.2f} ms  ({pct(self_ms):.2f}%)  samples={self_samples}")

if __name__ == "__main__":
    main()
