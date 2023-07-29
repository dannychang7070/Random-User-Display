import { useEffect, useState } from 'react';
import axios from "axios";
import "./style.css";

const SortingDirection = {
  ASCENDING: "ASCENDING",
  DESCENDING: "DESCENDING",
  UNSORTED: "UNSORTED"
}

const fetchData = () => {
  return axios.get('https://randomuser.me/api/?results=20')
    .then((res) => {
      const { results } = res.data;
      return results;
    })
    .catch((err) => {
      console.error(err);
    })
}

const flattenLocations = (locations) => {
  const data = [];
  for (const { street, coordinates, timezone, ...rest } of locations) {
    data.push({
      ...rest,
      number: street.number,
      name: street.name,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });
  }
  const flattenedLocationHeaders = extractObjectKeys(data[0]);
  return { headers: flattenedLocationHeaders, data };
};

const extractObjectKeys = (object) => {
  let objectKeys = [];
  Object.keys(object).forEach((objectKey) => {
    const value = object[objectKey];
    if (typeof value !== "object") {
      objectKeys.push(objectKey);
    } else {
      objectKeys = [...objectKeys, ...extractObjectKeys(value)];
    }
  });
  return objectKeys;
};

const sortData = (data, sortKey, sortingDirection) => {
  data.sort((a, b) => {
    const relevantValueA = a[sortKey];
    const relevantValueB = b[sortKey];
    if (
      sortingDirection === SortingDirection.UNSORTED ||
      sortingDirection === SortingDirection.ASCENDING
    ) {
      if (relevantValueA < relevantValueB) return -1;
      if (relevantValueA > relevantValueB) return 1;
      return 0;
    } else {
      if (relevantValueA > relevantValueB) return -1;
      if (relevantValueA < relevantValueB) return 1;
      return 0;
    }
  });
};

const getNextSortingDirection = (sortingDirection) => {
  if (
    sortingDirection === SortingDirection.UNSORTED ||
    sortingDirection === SortingDirection.ASCENDING
  ) {
    return SortingDirection.DESCENDING;
  }
  return SortingDirection.ASCENDING;
};

const getFilteredRows = (rows, filterKey) => {
  return rows.filter((row) => {
    return Object.values(row).some((s) =>
      ("" + s).toLowerCase().includes(filterKey)
    );
  });
};

export default function App() {
  const [flattenedLocations, setFlattenedLocations] = useState({
    headers: [],
    data: []
  });
  const [sortingDirections, setSortingDirections] = useState({});
  const [inputFieldValue, setInputFieldValue] = useState("");
  const sortColumn = (sortKey) => {
    const newFlattenedLocations = {
      ...flattenedLocations,
      data: [...flattenedLocations.data]
    };
    const currentSortingDirection = sortingDirections[sortKey];
    sortData(newFlattenedLocations.data, sortKey, currentSortingDirection);
    const nextSortingDirection = getNextSortingDirection(currentSortingDirection);
    const newSortingDirections = { ...sortingDirections };
    newSortingDirections[sortKey] = nextSortingDirection;
    setFlattenedLocations(newFlattenedLocations);
    setSortingDirections(newSortingDirections);
  };
  useEffect(() => {
    fetchData().then(apiPeople => {
      const ourFlattenedLocations = flattenLocations(
        apiPeople.map(({ location }) => location)
      );
      setFlattenedLocations(ourFlattenedLocations);
      const { headers } = ourFlattenedLocations;
      const ourSortingDirections = {};
      for (const header of headers) {
        ourSortingDirections[header] = SortingDirection.UNSORTED;
      }
      setSortingDirections(ourSortingDirections);
    });
  }, [])
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <input
        value={inputFieldValue}
        onChange={(e) => {
          setInputFieldValue(e.target.value);
        }}
      />
      <table className="Table">
        <thead>
          <tr>
            {flattenedLocations.headers.map(
              (locationString, locationIdx) => (
                <th
                  key={locationIdx}
                  onClick={() => {
                    sortColumn(locationString);
                  }}
                >
                  {locationString}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {getFilteredRows(flattenedLocations.data, inputFieldValue).map(
            (location, locationIdx) => (
              <tr key={locationIdx}>
                {flattenedLocations.headers.map((header, headerIdx) => (
                  <td key={headerIdx}>{location[header]}</td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
