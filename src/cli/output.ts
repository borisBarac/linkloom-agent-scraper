export const writeOutput = async (content: string, outputPath?: string) => {
  if (outputPath) {
    await Bun.write(outputPath, content);
    console.error(`Written to ${outputPath}`);
  } else {
    console.log(content);
  }
};
