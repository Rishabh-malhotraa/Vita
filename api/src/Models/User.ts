import { Schema, model } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserSchemaType, MentorSchemaType, DurationType } from '../types';
import { JWT } from '../config/keys';

const Duration = new Schema<DurationType>({
  start_hour: Number,
  end_hour: Number,
  available: Boolean,
  locale: String,
});

const MentorSchema = new Schema<MentorSchemaType>({
  user_id: { type: String },
  first_name: { type: String },
  last_name: { type: String },
  image_link: { type: String },
  job_title: { type: String },
  company: { type: String },
  description: { type: [String] },
  expertise: { type: [String] },
  language: { type: [String] },
  linkedIn: String,
  is_mentoring: Boolean,
  topics: [Number],
  time_slot: {
    monday: { type: Duration },
    tuesday: { type: Duration },
    wednesday: { type: Duration },
    thursday: { type: Duration },
    friday: { type: Duration },
    saturday: { type: Duration },
    sunday: { type: Duration },
  },
});

const UserSchema = new Schema<UserSchemaType>({
  user_id: String,
  first_name: { type: String },
  last_name: { type: String },
  password: { type: String },
  email: String,
  image_link: String,
  create_time: {
    type: Date,
    default: new Date(),
  },
  oauth_provider: String,
  is_mentor: Boolean,
  signup_completed: {
    type: Boolean,
    default: false,
  },
  mentor_information: {
    type: Schema.Types.ObjectId,
    ref: 'Mentor',
    default: null,
  },
  bookings: {
    type: [Schema.Types.ObjectId],
    ref: 'Booking',
    default: [],
  },
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12);
  }

  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  return await compare(password, this.password);
};

UserSchema.methods.issueToken = function () {
  return jwt.sign({ user_id: this._id }, JWT.secret, {
    expiresIn: JWT.expiresIn,
  });
};

UserSchema.methods.verifyToken = async function (token: string) {
  try {
    const decoded = jwt.verify(token, JWT.secret) as JwtPayload;
    const user = await this.model('User').findById(decoded.user_id);
    if (!user) {
      return false;
    }

    return user;
  } catch (err) {
    return false;
  }
};

UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

MentorSchema.index(
  {
    first_name: 'text',
    last_name: 'text',
    job_title: 'text',
    company: 'text',
    description: 'text',
    expertise: 'text',
    language: 'text',
  },
  {
    language_override: 'dummy',
    weights: {
      company: 3,
      job_title: 4,
      expertise: 4,
    },
  },
); // Full Text Search index on mentor model

export const UserModel = model('User', UserSchema);
export const MentorModel = model('Mentor', MentorSchema);
