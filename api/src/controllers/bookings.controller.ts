import { Request, Response } from 'express';
import { Document, FilterQuery } from 'mongoose';

import { BookingModel } from '../Models/Booking';
import { MentorModel, UserModel } from '../Models/User';
import {
  sendBookingConfirmationMessage,
  sendBookingRequestMessage,
} from '../service/whatsapp-service';
import { sendEmail } from '../service/email-service';
import { makeTemplate } from '../utils/makeTemplate';

import {
  AttendeesEmailTypes,
  BookingSchemaType,
  CalendarOptionTypes,
  UserSchemaType,
} from '../types';

import createCalenderEvent from '../utils/createCalendarEvent';
import moment from 'moment-timezone';
import notificationController from './notification.controller';
import { APP_NAME, ASSET_FOLDER, CLIENT_URL } from '../config/keys';

enum BookingStatus {
  ACCEPTED = 'accepted',
  WAITING = 'waiting',
  CANCELLED = 'cancelled',
}

const availability = async (req: Request, res: Response) => {
  const { id } = req.query as { id: string };

  const mentor = await MentorModel.findById(id);

  if (!mentor) {
    return res.status(404).json({
      error: 'Mentor not found',
    });
  }

  const bookings = await BookingModel.find({
    mentor: mentor._id,
    status: BookingStatus.ACCEPTED,
  });

  if (bookings.length === 0) {
    return res.json([]);
  }

  const busySlots: Date[] = [];

  for (const booking of bookings) {
    busySlots.push(booking.start_date);
  }

  return res.status(200).json(busySlots);
};

const bookSlot = async (req: Request, res: Response) => {
  const user = req.user as UserSchemaType & Document;
  const { start_date, mentor_id, email, topic, description } = req.body as {
    start_date: string;
    mentor_id: string;
    email?: string;
    topic?: string;
    description?: string;
  };

  if (user._id === mentor_id) {
    return res.status(400).json({
      error: "You can't book yourself",
    });
  }

  const startDate = new Date(start_date);

  const mentor = await MentorModel.findById(mentor_id);

  if (!mentor) {
    return res.json(404).json({
      error: 'Mentor Not Found!',
    });
  }

  if (!mentor.is_mentoring) {
    return res.json(404).json({
      error: 'Mentor currently is not mentoring',
    });
  }

  const alreadyWaiting = await BookingModel.findOne({
    mentee: user._id,
    mentor: mentor_id,
    status: BookingStatus.WAITING,
  });

  if (alreadyWaiting) {
    return res.status(400).json({
      error:
        'You already have a booking slot in waiting with this mentor. You cannot book for one more till that slot is accepted or cancelled',
    });
  }

  if (
    !mentor.time_slots.find(
      (slot) =>
        slot.start.getUTCHours() === startDate.getUTCHours() &&
        slot.start.getUTCMinutes() === startDate.getUTCMinutes() &&
        slot.start.getUTCDay() === startDate.getUTCDay(),
    )
  ) {
    return res.status(400).json({
      error: 'Mentor does not have a slot for given time',
    });
  }

  const existingBookings = await BookingModel.find({ mentor: mentor._id });

  const existingBooking = existingBookings.find(({ start_date }) => {
    if (
      start_date.getUTCHours() === startDate.getUTCHours() &&
      start_date.getUTCMinutes() === startDate.getUTCMinutes() &&
      start_date.getUTCDate() === startDate.getUTCDate()
    )
      return true;

    return false;
  });

  if (existingBooking && existingBooking.status === BookingStatus.ACCEPTED) {
    return res.status(400).json({
      error: 'Mentor is already booked',
    });
  }

  if (
    existingBooking &&
    existingBooking.status === BookingStatus.WAITING &&
    existingBooking.mentee === user._id
  ) {
    return res.status(400).json({
      error: 'You already have one booking in waiting with this mentor!',
    });
  }

  const end_date = new Date();
  end_date.setDate(startDate.getDate());
  end_date.setMonth(startDate.getMonth());
  end_date.setMinutes(startDate.getMinutes());
  end_date.setHours(startDate.getHours() + 1);

  const booking = new BookingModel({
    mentor_email: mentor.email,
    mentee_email: user.email,
    mentor_phone: mentor.phone,
    mentee_phone: user.phone,
    mentee: user._id,
    mentor: mentor._id,
    start_date: startDate,
    end_date,
    session: {
      email,
      topic,
      description,
    },
  });

  const menteeName = `${user.first_name} ${user.last_name}`;
  const mentorName = `${mentor.first_name} ${mentor.last_name}`;
  const date = moment(startDate).tz(mentor.timezone);

  user.currentSessionsRequested += 1;
  user.lastSessionRequested = startDate;

  mentor.currSessionReqs += 1;
  mentor.lastSessionReq = startDate;

  const allPromises = [];
  allPromises.push(booking.save());
  allPromises.push(mentor.save());
  allPromises.push(user.save());

  allPromises.push(
    sendBookingRequestMessage(
      mentor.phone,
      mentorName,
      menteeName,
      date.format('dddd, MMMM Do YYYY, h:mm a'),
      booking._id,
    ),
  );

  allPromises.push(
    notificationController.notify(
      mentor._id,
      `Booking Request from ${menteeName}`,
      `${menteeName} has requested a booking slot on ${date.format(
        'dddd, MMMM Do YYYY, h:mm a',
      )}`,
      `/dashboard`,
    ),
  );

  await Promise.all(allPromises);

  try {
    await sendEmail(
      email || mentor.email,
      'Regarding Session',
      makeTemplate('mentorBookingNotify.hbs', {
        user: user.first_name + ' ' + user.last_name,
        clientUrl: CLIENT_URL,
        session: {
          topic,
          description,
        },
        appName: APP_NAME,
        assetFolder: ASSET_FOLDER,
      }),
    );

    res.json({
      success: true,
      booking_id: booking._id,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "Email couldn't send!",
    });
  }
};

const acceptBooking = async (req: Request, res: Response) => {
  try {
    const mentor = req.user as UserSchemaType & Document;
    const { id } = req.params;
    const booking = await BookingModel.findById(id);

    if (!booking) {
      return res.json(404).json({
        error: 'Booking Not Found!',
      });
    }

    if (booking.mentor?.toString() !== mentor._id.toString()) {
      return res
        .status(404)
        .json({ error: 'You dont have access to accept this booking!' });
    }

    if (booking.status === BookingStatus.ACCEPTED) {
      return res.status(400).json({
        error: 'Booking already accepted',
      });
    }

    booking.status = BookingStatus.ACCEPTED;

    const attendeesEmails: AttendeesEmailTypes[] = [
      { email: booking.mentor_email },
      { email: booking.mentee_email },
    ];

    const options: CalendarOptionTypes = {
      startTime: booking.start_date,
      endTime: booking.end_date,
      attendeesEmails,
      summary: booking.session.topic,
      description: booking.session.description,
    };

    const event = await createCalenderEvent(options);
    booking.event_id = event.id;
    booking.google_meeting_link = event.hangoutLink;

    const mentee = (await UserModel.findById(booking.mentee)) as UserSchemaType;

    const slot = moment(booking.start_date);
    const googleMeetCode = event.hangoutLink.split('/').pop();
    const mentorName = `${mentor.first_name} ${mentor.last_name}`;
    const menteeName = `${mentee.first_name} ${mentee.last_name}`;

    await booking.save();

    await notificationController.notify(
      booking.mentee?.toString() || '',
      `Booking Accepted by ${mentorName}`,
      `${mentorName} has accepted your booking slot on ${slot.format(
        'dddd, MMMM Do YYYY, h:mm a',
      )}`,
      `/dashboard`,
    );

    await sendBookingConfirmationMessage(
      mentee.phone,
      menteeName,
      mentorName,
      booking.session.topic || '',
      slot.tz(mentee.timezone).format('dddd, MMMM Do YYYY, h:mm a'),
      googleMeetCode,
    );

    await sendBookingConfirmationMessage(
      mentor.phone,
      mentorName,
      menteeName,
      booking.session.topic || '',
      slot.tz(mentor.timezone).format('dddd, MMMM Do YYYY, h:mm a'),
      googleMeetCode,
    );

    const mentorDoc = await MentorModel.findOne({ _id: booking.mentor });

    if (mentorDoc) {
      mentorDoc.currentSessions += 1;
      mentorDoc.currSessionReqs -= 1;
      await mentorDoc.save();
    }

    return res.status(200).json({ message: 'Meet Scheduled!' });
  } catch (err) {
    console.log(err instanceof Error ? err.message : err);
    return res.status(500).json({
      message: 'Unable to Schedule meet',
    });
  }
};

const rejectBooking = async (req: Request, res: Response) => {
  try {
    const mentor = req.user as UserSchemaType & Document;
    const { id } = req.params;

    const booking = await BookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found',
      });
    }

    if (booking.mentor?.toString() !== mentor._id.toString()) {
      return res
        .status(404)
        .json({ error: 'You dont have access to reject this booking!' });
    }

    const mentee = await UserModel.findById(booking.mentee);

    if (!mentee) {
      return res.status(404).json({
        message: 'Mentee not found',
      });
    }

    await BookingModel.deleteOne({ _id: booking._id });

    const slot = moment(booking.start_date).tz(mentee.timezone);
    const template = makeTemplate('bookingRejected.hbs', {
      mentorName: `${mentor.first_name} ${mentor.last_name}`,
      menteeName: `${mentee.first_name} ${mentee.last_name}`,
      appName: APP_NAME,
      assetFolder: ASSET_FOLDER,
      date: slot.format('dddd, MMMM Do YYYY'),
      time: slot.format('h:mm a'),
      reason: req.body.reason,
    });

    await sendEmail(mentee.email, 'Booking Rejected', template);

    await notificationController.notify(
      booking.mentee?.toString() || '',
      `Booking Rejected by ${mentor.first_name} ${mentor.last_name}`,
      `${mentor.first_name} ${
        mentor.last_name
      } has rejected your booking slot on ${slot.format(
        'dddd, MMMM Do YYYY, h:mm a',
      )}`,
    );

    mentee.currentSessionsRequested -= 1;
    await Promise.all([
      mentee.save(),
      MentorModel.updateOne(
        { _id: booking.mentor },
        { $inc: { currSessionReqs: -1 } },
      ),
    ]);

    return res.status(200).json({ message: 'Booking Rejected!' });
  } catch (err) {
    console.log(err instanceof Error ? err.message : err);
    return res.status(500).json({
      message: 'Unable to Schedule meet',
    });
  }
};

const getBookings = async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const user = req.user as UserSchemaType & Document;

  const searchOptions: FilterQuery<BookingSchemaType> = {
    $or: [{ mentee: user._id }, { mentor: user._id }],
  };

  if (type === 'upcoming') {
    searchOptions.start_date = { $gte: new Date() };
    searchOptions.status = BookingStatus.ACCEPTED;
  } else if (type === 'past') {
    searchOptions.start_date = { $lte: new Date() };
  } else if (type === 'pending') {
    searchOptions.status = BookingStatus.WAITING;
  } else {
    return res.status(400).json({
      error:
        'Please provide a valid query param of type upcoming, past or pending',
    });
  }

  const bookings = await BookingModel.find(searchOptions)
    .populate('mentor', 'first_name last_name avatar.url')
    .populate('mentee', 'first_name last_name avatar.url');

  return res.json(bookings);
};

export default {
  availability,
  bookSlot,
  acceptBooking,
  rejectBooking,
  getBookings,
};
