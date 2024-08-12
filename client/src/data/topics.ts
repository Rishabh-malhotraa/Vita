import axios from 'axios';
import { SERVER_URL } from 'config.keys';
import { Topic } from 'types';
import { shuffleArray } from 'utils/helper';

type MotivationType = 'Job Search' | 'Career Advice' | 'Skills' | 'Leadership';

// const topicsData: Topic[] = [];

const getTopics = () => {
  const fetchTopics = async () => {
    let topics: Topic[] = [];
    try {
      const resp = await axios.get<Topic[]>(`${SERVER_URL}/api/get-topics`);
      topics = resp.data;
      return topics;
    } catch (err) {
      console.error(err);
    }

    return topics;
  };

  return fetchTopics();
};

export const getTopicOptions = (motivation: MotivationType) =>
  topics
    .filter((topic) => topic.motivation === motivation)
    .map((topic) => ({
      label: topic.topicName,
      value: topic.value,
    }));

export const shuffleTopics = shuffleArray(await getTopics());
export const topics = shuffleTopics.sort((a, b) => a.value - b.value);
