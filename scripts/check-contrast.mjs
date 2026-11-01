const pairs = [
  ["Hero title", "#FFFFFF", "#103D39"],
  ["Hero subtitle", "#E0EBE7", "#103D39"],
  ["Hero footnote", "#D7E5E0", "#103D39"],
  ["Lime eyebrow", "#DFF29A", "#103D39"],
  ["Demo tag", "#103D39", "#DFF29A"],
  ["Body text", "#173431", "#F3F6F2"],
  ["Muted text", "#60736F", "#F3F6F2"],
  ["Muted text on white", "#60736F", "#FFFFFF"],
  ["Eyebrow", "#0D5D55", "#F3F6F2"],
  ["Ink-soft text on white", "#405A56", "#FFFFFF"],
  ["Primary button", "#FFFFFF", "#0D5D55"],
  ["Outline button", "#103D39", "#FFFFFF"],
  ["Quiet button", "#405A56", "#EDF2EE"],
  ["Follow-up stage", "#6B4D00", "#FFF2CB"],
  ["Promise stage", "#135347", "#DCEFE5"],
  ["Partial stage", "#344D7A", "#E4EBFA"],
  ["Warning text", "#634700", "#FFF6DF"],
  ["Error text", "#8A2D22", "#FFF0ED"],
  ["Main text on warning panel", "#173431", "#FFF6DF"],
  ["Main text on error panel", "#173431", "#FFF0ED"],
];

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

for (const [name, foreground, background] of pairs) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  console.log(`${name}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1 ${ratio >= 4.5 ? "PASS" : "FAIL"}`);
}
