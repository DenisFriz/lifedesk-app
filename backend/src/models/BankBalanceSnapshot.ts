import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';
import {
  encrypt,
  decrypt,
  encryptNullable,
  decryptNullable,
} from '@utils/encryption.js';

interface IBankBalanceSnapshot {
  _id: Types.ObjectId;
  created_by: string;
  date: string | null;
  account_id: string | null;
  account_name: string | null;
  institution_name: string | null;
  balance: number | null;
  available: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

const BankBalanceSnapshotSchema = new Schema<IBankBalanceSnapshot>(
  {
    created_by: { type: String, required: true, index: true },
    date: String,
    account_id: String,
    account_name: String,
    institution_name: String,
    balance: String,
    available: String,
    currency: { type: String, default: 'EUR' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

BankBalanceSnapshotSchema.index({ date: 1, created_by: 1 });

BankBalanceSnapshotSchema.pre(
  'save',
  function (this: HydratedDocument<IBankBalanceSnapshot>) {
    this.updatedAt = new Date().toISOString();
    const doc = this as any;
    if (this.isModified('account_id') && doc.account_id) {
      doc.account_id = encryptNullable(doc.account_id) || doc.account_id;
    }
    if (this.isModified('balance') && doc.balance != null) {
      doc.balance = encrypt(String(doc.balance));
    }
    if (this.isModified('available') && doc.available != null) {
      doc.available = encrypt(String(doc.available));
    }
  },
);

BankBalanceSnapshotSchema.pre('insertMany', function (docs) {
  if (!Array.isArray(docs)) return;
  docs.forEach((doc: any) => {
    if (doc.account_id) {
      doc.account_id = encryptNullable(doc.account_id) || doc.account_id;
    }
    if (doc.balance != null) {
      doc.balance = encrypt(String(doc.balance));
    }
    if (doc.available != null) {
      doc.available = encrypt(String(doc.available));
    }
  });
});

BankBalanceSnapshotSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as any;
  if (update?.$set) {
    if (update.$set.account_id) {
      update.$set.account_id =
        encryptNullable(update.$set.account_id) || update.$set.account_id;
    }
    if (update.$set.balance != null) {
      update.$set.balance = encrypt(String(update.$set.balance));
    }
    if (update.$set.available != null) {
      update.$set.available = encrypt(String(update.$set.available));
    }
  }
});

BankBalanceSnapshotSchema.post<any>(['find', 'findOne'], function (result) {
  if (!result) return;
  const docs = Array.isArray(result) ? result : [result];
  docs.filter(Boolean).forEach((doc: any) => {
    if (doc.account_id) {
      doc.account_id = decryptNullable(doc.account_id) || doc.account_id;
    }
    if (doc.balance) {
      doc.balance = parseFloat(decrypt(doc.balance));
    }
    if (doc.available) {
      doc.available = parseFloat(decrypt(doc.available));
    }
  });
});

export const BankBalanceSnapshot: Model<IBankBalanceSnapshot> =
  mongoose.model<IBankBalanceSnapshot>(
    'BankBalanceSnapshot',
    BankBalanceSnapshotSchema,
  );
