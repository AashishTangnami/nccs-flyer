import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FlyerMaker from "./FlyerMaker";

const mocks = vi.hoisted(() => ({
  preloadBackgroundRemoval: vi.fn(),
  removeImageBackground: vi.fn(),
  resizeImage: vi.fn(),
  toBlob: vi.fn()
}));

vi.mock("@/lib/image-utils", () => ({
  preloadBackgroundRemoval: mocks.preloadBackgroundRemoval,
  removeImageBackground: mocks.removeImageBackground,
  resizeImage: mocks.resizeImage
}));

vi.mock("html-to-image", () => ({
  toBlob: mocks.toBlob
}));

function makeFile(type = "image/png") {
  return new File(["image"], `photo.${type.split("/")[1]}`, { type });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function renderFlyerMaker() {
  return render(React.createElement(FlyerMaker));
}

async function uploadValidPhoto(user: ReturnType<typeof userEvent.setup>) {
  const input = screen.getByLabelText("Choose Photo");
  await user.upload(input, makeFile());
}

async function selectBlueTemplate(user: ReturnType<typeof userEvent.setup>) {
  for (let index = 0; index < 2; index += 1) {
    await user.click(screen.getByRole("button", { name: "Next template" }));
  }
}

describe("FlyerMaker", () => {
  beforeEach(() => {
    mocks.resizeImage.mockResolvedValue(new Blob(["resized"], { type: "image/png" }));
    mocks.removeImageBackground.mockResolvedValue(new Blob(["transparent"], { type: "image/png" }));
    mocks.preloadBackgroundRemoval.mockResolvedValue({});
    mocks.toBlob.mockResolvedValue(new Blob(["export"], { type: "image/png" }));
  });

  it("renders the initial editor, one lazy template thumbnail, and preview", () => {
    renderFlyerMaker();

    expect(screen.getByRole("heading", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Photo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Text" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Live Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download PNG" })).toBeInTheDocument();
    expect(screen.getAllByAltText(/flyer template/i)).toHaveLength(1);
  });

  it("switches templates with next and previous controls", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();

    expect(
      screen.getByRole("button", { name: "Selected template: Promote yourself in Himalayan Mela" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next template" }));

    expect(
      screen.getByRole("button", { name: "Selected template: Promote yourself in Himalayan Mela" })
    ).toBeInTheDocument();
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(screen.getAllByAltText(/flyer template/i)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Previous template" }));
    expect(
      screen.getByRole("button", { name: "Selected template: Promote yourself in Himalayan Mela" })
    ).toBeInTheDocument();
  });

  it("uses the custom white text layout on the blue template", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();
    await selectBlueTemplate(user);

    expect(screen.getByTestId("flyer-text-promoterName")).toHaveStyle({
      left: "-345.653543px",
      top: "2165.136933px",
      width: "1800px",
      height: "205.968296px",
      color: "rgb(255, 255, 255)",
      fontSize: "100px",
      fontWeight: "900",
      textAlign: "center"
    });
    expect(screen.getByTestId("flyer-text-message")).toHaveStyle({
      left: "579.611789px",
      top: "2606.772823px",
      width: "2225.317721px",
      height: "333.003986px",
      color: "rgb(255, 255, 255)",
      fontSize: "100px",
      fontWeight: "700",
      lineHeight: "1.2",
      textAlign: "center"
    });
  });

  it("rejects unsupported files", async () => {
    renderFlyerMaker();
    const file = makeFile("text/plain");

    fireEvent.change(screen.getByLabelText("Choose Photo"), {
      target: {
        files: {
          0: file,
          length: 1,
          item: () => file
        }
      }
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please upload a JPG, PNG, or WebP image."
    );
  });

  it("starts background removal on upload and allows removing/reuploading", async () => {
    const user = userEvent.setup();
    const removal = deferred<Blob>();
    mocks.removeImageBackground.mockReturnValueOnce(removal.promise);
    renderFlyerMaker();

    await uploadValidPhoto(user);

    expect(screen.getByAltText("Original uploaded preview")).toBeInTheDocument();
    expect(screen.queryByTestId("flyer-photo")).not.toBeInTheDocument();
    expect(mocks.resizeImage).toHaveBeenCalled();
    expect(mocks.removeImageBackground).toHaveBeenCalled();

    removal.resolve(new Blob(["transparent"], { type: "image/png" }));
    expect(await screen.findByAltText("Background removed uploaded photo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Background" })).not.toBeInTheDocument();
    expect(mocks.resizeImage).toHaveBeenCalled();
    expect(mocks.removeImageBackground).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Remove Photo" }));
    expect(screen.queryByTestId("flyer-photo")).not.toBeInTheDocument();

    await uploadValidPhoto(user);
    expect(await screen.findByAltText("Background removed uploaded photo")).toBeInTheDocument();
  });

  it("allows editing flyer text while photo background removal is still running", async () => {
    const user = userEvent.setup();
    const removal = deferred<Blob>();
    mocks.removeImageBackground.mockReturnValueOnce(removal.promise);
    renderFlyerMaker();

    await uploadValidPhoto(user);
    await user.type(screen.getByLabelText("Promoter name"), "Aashish");

    expect(screen.getByTestId("flyer-text-promoterName")).toHaveTextContent("Aashish");
    expect(screen.queryByTestId("flyer-photo")).not.toBeInTheDocument();

    removal.resolve(new Blob(["transparent"], { type: "image/png" }));
    expect(await screen.findByAltText("Background removed uploaded photo")).toBeInTheDocument();
    expect(screen.getByTestId("flyer-text-promoterName")).toHaveTextContent("Aashish");
  });

  it("edits, styles, and deletes flyer text from the preview", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();

    const nameInput = screen.getByLabelText("Promoter name");
    await user.type(nameInput, "Aashish");
    const textLayer = screen.getByTestId("flyer-text-promoterName");
    expect(textLayer).toHaveTextContent("Aashish");

    fireEvent.focus(nameInput);
    await waitFor(() => expect(screen.getByLabelText("Weight")).toBeEnabled());
    await user.selectOptions(screen.getByLabelText("Weight"), "900");
    fireEvent.change(screen.getByLabelText("Color"), { target: { value: "#123456" } });
    fireEvent.change(screen.getByLabelText("Size"), { target: { value: "88" } });
    await user.selectOptions(screen.getByLabelText("Align"), "center");

    await waitFor(() => {
      expect(textLayer).toHaveStyle({
        color: "rgb(18, 52, 86)",
        fontSize: "88px",
        fontWeight: "900",
        textAlign: "center"
      });
    });

    await user.click(screen.getByRole("button", { name: "Delete Text" }));
    expect(screen.queryByTestId("flyer-text-promoterName")).not.toBeInTheDocument();
  });

  it("drags and resizes the photo anywhere on the flyer", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();
    await uploadValidPhoto(user);

    const photo = screen.getByTestId("flyer-photo");
    fireEvent.pointerDown(photo, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(window, { clientX: 120, clientY: 80 });
    fireEvent.pointerUp(window);

    expect(photo).toHaveStyle({
      left: "2013.853607px",
      top: "2561.465164px"
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Resize photo south-east" }), {
      clientX: 120,
      clientY: 80
    });
    fireEvent.pointerMove(window, { clientX: 220, clientY: 180 });
    fireEvent.pointerUp(window);

    expect(photo).toHaveStyle({
      width: "1386.042459px"
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Resize photo north-west" }), {
      clientX: 220,
      clientY: 180
    });
    fireEvent.pointerMove(window, { clientX: 120, clientY: 80 });
    fireEvent.pointerUp(window);

    expect(photo).toHaveStyle({
      left: "1913.853607px",
      top: "2461.465164px",
      width: "1486.042459px",
      height: "1914.104918px"
    });
  });

  it("zooms and pans inside the fixed blue circular frame", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();
    await selectBlueTemplate(user);
    await uploadValidPhoto(user);

    const zoom = await screen.findByLabelText("Photo zoom");
    await waitFor(() => expect(zoom).toBeEnabled());

    const photo = screen.getByTestId("flyer-photo");
    const image = within(photo).getByRole("img");
    const initialFrameStyle = {
      left: photo.style.left,
      top: photo.style.top,
      width: photo.style.width,
      height: photo.style.height
    };

    expect(screen.queryByRole("button", { name: /Resize photo/i })).not.toBeInTheDocument();
    fireEvent.change(zoom, { target: { value: "200" } });

    await waitFor(() => expect(zoom).toHaveValue("200"));
    expect(parseFloat(image.style.width)).toBeCloseTo(parseFloat(photo.style.width) * 2);
    expect(parseFloat(image.style.left)).toBeLessThan(0);

    fireEvent.pointerDown(photo, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(window, { clientX: 10020, clientY: 10020 });
    fireEvent.pointerUp(window);

    expect(photo).toHaveStyle(initialFrameStyle);
    expect(image).toHaveStyle({ left: "0px", top: "0px" });

    await user.click(screen.getByRole("button", { name: "Zoom out photo" }));
    expect(zoom).toHaveValue("190");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByTestId("flyer-photo")).not.toBeInTheDocument();
  });

  it("uses the visible blue crop in the canvas export fallback", async () => {
    const user = userEvent.setup();
    mocks.toBlob.mockRejectedValueOnce(new Error("DOM export failed"));
    renderFlyerMaker();
    await selectBlueTemplate(user);
    await uploadValidPhoto(user);

    const zoom = await screen.findByLabelText("Photo zoom");
    await waitFor(() => expect(zoom).toBeEnabled());
    fireEvent.change(zoom, { target: { value: "200" } });

    const photo = screen.getByTestId("flyer-photo");
    const image = within(photo).getByRole("img");
    await user.click(screen.getByRole("button", { name: "Download PNG" }));

    const getContextMock = vi.mocked(HTMLCanvasElement.prototype.getContext);
    await waitFor(() => expect(getContextMock).toHaveBeenCalled());
    const canvasContext = getContextMock.mock.results.at(-1)?.value as unknown as {
      drawImage: ReturnType<typeof vi.fn>;
    };
    await waitFor(() => expect(canvasContext.drawImage).toHaveBeenCalledTimes(2));
    const photoDraw = canvasContext.drawImage.mock.calls[1];

    expect(photoDraw[1]).toBeCloseTo(parseFloat(photo.style.left) + parseFloat(image.style.left));
    expect(photoDraw[2]).toBeCloseTo(parseFloat(photo.style.top) + parseFloat(image.style.top));
    expect(photoDraw[3]).toBeCloseTo(parseFloat(image.style.width));
    expect(photoDraw[4]).toBeCloseTo(parseFloat(image.style.height));
  });

  it("resets the crop and restores background removal when switching templates", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();
    await selectBlueTemplate(user);
    await uploadValidPhoto(user);

    const zoom = await screen.findByLabelText("Photo zoom");
    await waitFor(() => expect(zoom).toBeEnabled());
    fireEvent.change(zoom, { target: { value: "200" } });

    await user.click(screen.getByRole("button", { name: "Next template" }));
    await waitFor(() => expect(mocks.removeImageBackground).toHaveBeenCalled());
    expect(screen.queryByLabelText("Photo zoom")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous template" }));
    expect(await screen.findByLabelText("Photo zoom")).toHaveValue("100");
  });

  it("keeps photo placement after the background-removed image loads", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();
    await uploadValidPhoto(user);

    const originalPhoto = screen.getByTestId("flyer-photo");
    fireEvent.pointerDown(originalPhoto, { clientX: 20, clientY: 20 });
    fireEvent.pointerMove(window, { clientX: 120, clientY: 80 });
    fireEvent.pointerUp(window);

    await screen.findByAltText("Background removed uploaded photo");
    const processedPhoto = screen.getByTestId("flyer-photo");
    expect(mocks.resizeImage).toHaveBeenCalled();
    expect(mocks.removeImageBackground).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Remove Background" })).not.toBeInTheDocument();
    expect(processedPhoto).toHaveStyle({
      left: "2013.853607px",
      top: "2561.465164px"
    });
  });

  it("downloads with a blob object URL instead of a base64 data URL", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();

    await user.click(screen.getByRole("button", { name: "Download PNG" }));

    await waitFor(() => expect(mocks.toBlob).toHaveBeenCalled());
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("resets image and text state while keeping the selected template", async () => {
    const user = userEvent.setup();
    renderFlyerMaker();

    await user.click(screen.getByRole("button", { name: "Next template" }));
    await uploadValidPhoto(user);
    await user.type(screen.getByLabelText("Promoter name"), "NCCS");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(
      screen.getByRole("button", { name: "Selected template: Promote yourself in Himalayan Mela" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("flyer-photo")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("flyer-text-promoterName")).queryByText("NCCS")).toBeNull();
  });
});
