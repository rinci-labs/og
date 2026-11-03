// Renders the cards for each RINCI site into examples/, to check the layout by eye.
import { mkdir, writeFile } from "node:fs/promises"
import { type CardProps, renderCard } from "../src/index"

const cards: Record<string, CardProps> = {
  secrets: { title: "Every secrets manager,", subtitle: "one command.", chip: "rinci-secrets run -- bun dev" },
  link: { title: "Short links, custom domains,", subtitle: "and click analytics.", chip: "rin.ci/your-slug" },
  docs: {
    title: "AWS Secrets Manager",
    subtitle: "Read secrets from AWS Secrets Manager with SigV4 signing, no SDK.",
    chip: "secrets.rin.ci/docs/aws",
    label: "Docs · Providers",
  },
}

await mkdir("examples", { recursive: true })
for (const [name, props] of Object.entries(cards)) {
  await writeFile(`examples/${name}.png`, await renderCard(props))
  console.log(`examples/${name}.png`)
}
