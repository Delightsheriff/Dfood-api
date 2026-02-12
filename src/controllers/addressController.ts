import { Request, Response } from "express";
import { addressService } from "../services/addressService";
import { asyncHandler } from "../utils/asyncHandler";
import { createAddressSchema, updateAddressSchema } from "../types/address";

export const createAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createAddressSchema.parse(req.body);
    const address = await addressService.create(req.user!._id.toString(), data);

    res.status(201).json({
      success: true,
      data: { address },
    });
  },
);

export const getAllAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const addresses = await addressService.getAll(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: { addresses },
    });
  },
);

export const getAddressById = asyncHandler(
  async (req: Request, res: Response) => {
    const address = await addressService.getById(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { address },
    });
  },
);

export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateAddressSchema.parse(req.body);
    const address = await addressService.update(
      req.params.id as string,
      req.user!._id.toString(),
      data,
    );

    res.status(200).json({
      success: true,
      data: { address },
    });
  },
);

export const setDefaultAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const address = await addressService.setDefault(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      data: { address },
    });
  },
);

export const deleteAddress = asyncHandler(
  async (req: Request, res: Response) => {
    await addressService.delete(
      req.params.id as string,
      req.user!._id.toString(),
    );

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  },
);

export const getDefaultAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const address = await addressService.getDefault(req.user!._id.toString());

    res.status(200).json({
      success: true,
      data: { address },
    });
  },
);
