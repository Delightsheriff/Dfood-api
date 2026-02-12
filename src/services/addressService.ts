import Address, { IAddress } from "../models/Address";
import { CreateAddressInput, UpdateAddressInput } from "../types/address";
import { NotFoundError, ForbiddenError } from "../types/errors";

export class AddressService {
  async create(userId: string, data: CreateAddressInput): Promise<IAddress> {
    // If this is the first address, make it default
    const existingCount = await Address.countDocuments({ userId });
    const isDefault = existingCount === 0;

    const address = await Address.create({
      ...data,
      userId,
      isDefault,
    });

    return address;
  }

  async getAll(userId: string): Promise<IAddress[]> {
    const addresses = await Address.find({ userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    return addresses;
  }

  async getById(id: string, userId: string): Promise<IAddress> {
    const address = await Address.findById(id);

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    if (address.userId.toString() !== userId) {
      throw new ForbiddenError("You can only access your own addresses");
    }

    return address;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateAddressInput,
  ): Promise<IAddress> {
    const address = await Address.findById(id);

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    if (address.userId.toString() !== userId) {
      throw new ForbiddenError("You can only update your own addresses");
    }

    if (data.label) address.label = data.label;
    if (data.street) address.street = data.street;
    if (data.city) address.city = data.city;
    if (data.state) address.state = data.state;
    if (data.coordinates) address.coordinates = data.coordinates;

    await address.save();

    return address;
  }

  async setDefault(id: string, userId: string): Promise<IAddress> {
    const address = await Address.findById(id);

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    if (address.userId.toString() !== userId) {
      throw new ForbiddenError("You can only update your own addresses");
    }

    // Unset all other addresses as default
    await Address.updateMany(
      { userId, _id: { $ne: id } },
      { isDefault: false },
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    return address;
  }

  async delete(id: string, userId: string): Promise<void> {
    const address = await Address.findById(id);

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    if (address.userId.toString() !== userId) {
      throw new ForbiddenError("You can only delete your own addresses");
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If deleted address was default, set another one as default
    if (wasDefault) {
      const nextAddress = await Address.findOne({ userId }).sort({
        createdAt: -1,
      });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }
  }

  async getDefault(userId: string): Promise<IAddress | null> {
    const address = await Address.findOne({ userId, isDefault: true });
    return address;
  }
}

export const addressService = new AddressService();
