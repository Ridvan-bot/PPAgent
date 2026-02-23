/**
 * PPAgent – AI assistant
 * Entry point. Extend with tools, prompts, and integrations.
 */

async function main(): Promise<void> {
  console.log("PPAgent ready.");
  // TODO: Add agent loop, tool calls, LLM integration
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
