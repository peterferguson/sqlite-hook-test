import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react'
import { openDatabaseSync, SQLiteProvider, useSQLiteContext, addDatabaseChangeListener } from 'expo-sqlite/next';

const db = openDatabaseSync( ':memory:', {
  enableChangeListener: true
} );

console.log( "db", db )

db.execSync(
  'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
);

const insertRow = () => db.runSync( 'INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123 )
const truncate = () => db.runSync( 'DELETE FROM test' )

console.log( 'insert - ', insertRow() );

const statement = db.prepareSync( 'SELECT * FROM test' );
for ( const row of statement.eachSync() ) {
  console.log( 'row -', row );
}

export default function App() {
  return (
    <View style={ styles.container }>
      <SQLiteProvider dbName=":memory:">
        <Child />
      </SQLiteProvider>
      <StatusBar style="auto" />
    </View>
  );
}

const Child = () => {
  const database = useSQLiteContext()

  const [rows, setRows] = useState( database.allSync( 'SELECT * FROM test' ) )

  const refreshRows = () => setRows( database.allSync( 'SELECT * FROM test' ) )

  useEffect( () => {
    const subscription = addDatabaseChangeListener( ( change ) => {
      console.log( `detected change - `, change )
      refreshRows()
    } )

    return () => {
      subscription.remove()
    }
  }, [] )

  useEffect( () => {
    const interval = setInterval( insertRow, 1000 )

    return () => {
      interval && clearInterval( interval )
    }

  }, [] )

  useEffect( () => {
    if ( rows.length > 25 ) truncate()
    refreshRows()
  }, [rows.length] )


  if ( !rows ) return <Text style={ styles.text }>Nothing</Text>
  return <ScrollView>
    { rows?.map( ( row, i ) => {
      return <Text key={ `row-${i}` } style={ styles.text }>{ i } - { row.value }</Text>
    } ) }
  </ScrollView>
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: '#939393',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fafafa',
    fontSize: 24,
  }
} );
