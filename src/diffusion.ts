// https://platform.stability.ai/docs/getting-started/typescript-client

import fs from "fs-extra";
import * as Generation from "../generation/generation_pb";
import { GenerationServiceClient } from "../generation/generation_pb_service";
import { grpc as GRPCWeb } from "@improbable-eng/grpc-web";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";

import {
  buildGenerationRequest,
  executeGenerationRequest,
  GenerationResponse
} from "./diffusion_helpers";

import { getOutputFile } from "./utils";

// This is a NodeJS-specific requirement - browsers implementations should omit this line.
GRPCWeb.setDefaultTransport(NodeHttpTransport());

// Authenticate using your API key, don't commit your key to a public repository!
const metadata = new GRPCWeb.Metadata();
metadata.set("Authorization", "Bearer " + process.env.DIFFUSION_API_KEY);

// Create a generation client to use with all future requests
const client = new GenerationServiceClient("https://grpc.stability.ai", {});

async function saveImages(response: GenerationResponse, word: string) {
  if (response instanceof Error) {
    console.error("Generation failed", response);
    throw response;
  }

  console.log(
    `${response.imageArtifacts.length} image${
      response.imageArtifacts.length > 1 ? "s" : ""
    } were successfully generated.`
  );

  // Do something with NSFW filtered artifacts
  if (response.filteredArtifacts.length > 0) {
    console.log(
      `${response.filteredArtifacts.length} artifact` +
        `${response.filteredArtifacts.length > 1 ? "s" : ""}` +
        ` were filtered by the NSFW classifier and need to be retried.`
    );
  }

  // Do something with the successful image artifacts
  for (const artifact of response.imageArtifacts) {
    try {
      const file = await getOutputFile(word, "png");
      await fs.writeFile(file, Buffer.from(artifact.getBinary_asU8()))
    } catch (error) {
      console.error("Failed to write resulting image to disk", error);
    }
  }
}

export async function generateStableDiffusionImage(word: string, prompt: string, debug: boolean) {
  const request = buildGenerationRequest("stable-diffusion-512-v2-1", {
    type: "text-to-image",
    prompts: [
      {
        text: prompt,
      },
    ],
    width: 512,
    height: 512,
    samples: 1,
    cfgScale: 7,
    steps: 50,
    sampler: Generation.DiffusionSampler.SAMPLER_K_DPMPP_2M,
  });
  const generationResponse = await executeGenerationRequest(client, request, metadata)
  await saveImages(generationResponse, word);
}
