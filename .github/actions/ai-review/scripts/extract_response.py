#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["openai", "anthropic"], required=True)
    parser.add_argument("response_json")
    parser.add_argument("output_path")
    return parser.parse_args()


def error_message(response: dict) -> str | None:
    if "error" not in response:
        return None
    error = response.get("error", {})
    if isinstance(error, dict):
        return error.get("message", str(error))
    return str(error)


def extract_openai_text(response: dict) -> str:
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise SystemExit(f"OpenAI response format invalid: {exc}")
    return str(content).strip()


def extract_anthropic_text(response: dict) -> str:
    parts = [b.get("text", "") for b in response.get("content", []) if b.get("type") == "text"]
    if not parts:
        raise SystemExit("Anthropic response format invalid: missing text content blocks")
    return "\n".join(parts).strip()


def main() -> None:
    args = parse_args()
    response = json.loads(Path(args.response_json).read_text(encoding="utf-8"))

    msg = error_message(response)
    if msg:
        raise SystemExit(f"{args.provider.capitalize()} API error: {msg}")

    if args.provider == "openai":
        text = extract_openai_text(response)
    else:
        text = extract_anthropic_text(response)

    Path(args.output_path).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
