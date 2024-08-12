import React, { useState } from 'react';
import { Grid, InputBase, InputLabel, MenuItem, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { motivationOptions, shuffleTopics as topics } from 'data';
import TopicCard from 'components/TopicCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { motivationState, tabIndexState, topicState } from 'store';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { Topic } from 'types';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const LEN = 8;

const SearchWrapper = styled(Grid)({
  '.search_wrapper': {
    display: 'flex',
    alignItems: 'center',
  },
});

const TextAreaWrapper = styled(Paper)({
  marginLeft: '16px',
  padding: '2px 4px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'black !important',
  width: 400,

  '.Search_Input': {
    fontSize: '20px',
    padding: '0px 6px',
    width: '100%',
  },
});

const CardContainer = styled(Grid)({
  // Display: 'flex',
  // flexDirection: 'row',
  // justifyContent: 'space-around',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 320px)',
  justifyContent: 'space-between',
  marginTop: '3rem',
});

const filterTopics = (topics_: Topic[], motivation: string) => {
  if (motivation === 'All' || motivation === null) return topics_;
  return topics.filter((topic) => topic.motivation === motivation);
};

// mui menuprops
// mui select styling
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
};

const MentorsPage = () => {
  const [motivation, setMotivation] = useRecoilState(motivationState);
  const setTabIndex = useSetRecoilState(tabIndexState);
  const setTopic = useSetRecoilState(topicState);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState(topics.slice(0, LEN));

  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));

  // @ts-ignore
  const motivationValue = motivation ? motivation?.value : 'All';

  const handleChange = (event: SelectChangeEvent) => {
    event.preventDefault();
    const value = motivationOptions.find(
      (item) => item.value === event.target.value,
    );
    setMotivation(value);
  };

  const fetchMoreData = () => {
    const n = items.length;
    setTimeout(() => {
      setItems(topics.slice(0, n + LEN));
    }, 300);
  };

  return (
    <div style={{ padding: '0rem 2rem' }}>
      <SearchWrapper container spacing={2}>
        <Grid item xs={10} sm={4} className="search_wrapper">
          <TextAreaWrapper>
            <SearchIcon sx={{ color: 'darkgrey' }} />
            <InputBase
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setItems(
                  topics.filter((item) =>
                    item.topicName.includes(e.target.value),
                  ),
                );
              }}
              className="Search_Input"
              placeholder="Search by Topics"
              inputProps={{ 'aria-label': 'Search by Topics' }}
            />
          </TextAreaWrapper>
        </Grid>
        <Grid item xs={12} sm={4} lg={3} className="search_wrapper">
          <FormControl
            sx={{ m: 1, minWidth: 120, borderRadius: 4 }}
            size="small">
            {!motivationValue && (
              <InputLabel
                id="search"
                sx={{
                  color: '#868686',
                  fontSize: '20px',
                  paddingLeft: 2,
                  fontWeight: '400',
                }}>
                Filter by Motivation
              </InputLabel>
            )}
            <Paper
              sx={{ display: 'flex', minWidth: '240px', marginLeft: '16px' }}>
              <Select
                labelId="search"
                fullWidth
                value={motivationValue ?? null}
                onChange={handleChange}
                defaultValue=""
                sx={{
                  padding: '5px 6px',
                  borderRadius: 1,
                  color: '#868686',
                  fontSize: '18px',
                  backgroundColor: 'black !important',
                  boxShadow:
                    '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
                  backgroundImage:
                    'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                }}
                variant={'standard'}
                disableUnderline
                IconComponent={() => (
                  <i
                    style={{
                      position: 'absolute',
                      top: !motivationValue ? 10 : 5,
                      right: 5,
                      pointerEvents: 'none',
                    }}>
                    <ExpandMoreIcon />
                  </i>
                )}
                MenuProps={MenuProps}>
                {motivationOptions.map((item, index) => (
                  <MenuItem key={index} value={item.value}>
                    {item.value}
                  </MenuItem>
                ))}
              </Select>
            </Paper>
          </FormControl>
        </Grid>
      </SearchWrapper>
      <InfiniteScroll
        dataLength={Math.min(topics.length, items.length)}
        next={fetchMoreData}
        hasMore={
          filterTopics(items, motivationValue).length <
          filterTopics(topics, motivationValue).length
        }
        loader={<h4>Loading...</h4>}>
        <CardContainer container>
          {filterTopics(items, motivationValue).map((item, index) => (
            <div
              key={index}
              onClick={() => {
                setTopic(index);
                setTabIndex('1');
              }}>
              <TopicCard topic={item} />
            </div>
          ))}
        </CardContainer>
      </InfiniteScroll>
    </div>
  );
};

export default MentorsPage;
